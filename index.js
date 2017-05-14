const request = require("request")
const progress = require("request-progress")
const async = require("async")
const fs = require("fs")
const del = require("del")
const querystring = require("querystring")
const http = require("http")
const https = require("https")
const path = require("path")
const chalk = require("chalk")
const q = require("q")
	// const querystring = require('querystring')
let MAX = 10
	// console.time()
	// let url = "http://tieba.baidu.com/f?ie=utf-8&kw=%E8%B6%8A%E7%8B%B1&fr=search"
let url = ''
let count = 0
if (!fs.existsSync("./image")) {
	fs.mkdirSync("./image")
}
del.sync("./image/*")

var readCfgUrls = function() {
	const config = require("./cfg")
	let url = config.urls[0].toString()
		// console.log(url)
	return url
}

// var content = new iconv('gb2312','UTF8').convert('%CB%CE%D6%C7%D0%A2').toString()
var getImgUrl = function(str) { //获取每页url中的图片地址
	let reg = /Image".*?src=".*?"/g
	let s = str.match(reg),
		sf = []
	if (s) {
		reg = /http.*?\"/
		for (let i in s) {
			s[i] = s[i].match(reg).join().slice(0, -1).trim()
		}
		reg = /baidu/
		for (let i in s) {
			reg.test(s[i]) ? sf.push(s[i]) : ''
		}
		return sf
	}
	return []
}

//选择http还是https请求
function chooseProtocol(url) {
	var protocol = ''
	protocol = url.split(":")[0]
	return protocol === 'http' ? http : https
}

//根据getEveryPageUrl获取到的url,返回整个页面所有帖子的url
var getPageUrl = function(url) {
	let reg = /\/p\/[0-9]*/g,
		method = null,
		body = '',
		protocol = '',
		deferred = q.defer()
	protocol = url.split(":")[0]
	method = chooseProtocol(url)
	method.get(url, (res) => {
		// console.log(res)
		res.on('data', (chunk) => {
			body += chunk
		})
		res.on('end', () => {
			// console.log(body.match(reg))
			let urls = body.match(reg)
			deferred.resolve(urls.map((val, index) => {
				return protocol + "://tieba.baidu.com" + val
			}))
		})
	})
	return deferred.promise
}

//获取最大的page页数
var getMaxPage = function(tieba_url) {
	let reg = /pn=.*last pag/g,
		protocol = tieba_url.split(":")[0],
		rawData = '',
		max = '',
		method = null
	method = chooseProtocol(tieba_url)
	let deferred = q.defer()
	method.get(tieba_url, (res) => {
		if (res.statusCode !== 200) {
			console.log(protocol + " request error!")
		}
		res.on('data', (chunk) => {
			rawData += chunk
		})
		res.on('end', () => {
			max = rawData.match(reg).join().split("\"")[0].split('=')[1] / 50
			deferred.resolve(max)
				// return max
		})
	})
	return deferred.promise
}

var configInit = function() {
	if (!fs.existsSync("./cfg.json")) {
		console.log(`Not found cfg.json`)
		return
	}
	fs.readFile("./cfg.json", {
		encoding: "utf-8"
	}, (err, data) => {
		if (err) throw err
		if (JSON.parse(data).clearImageFile) {
			fs.rmdir("./image", (err) => {
				if (err) throw err
				console.log(`Image directory is removed`)
			})
		}
	})
}

//e.g http://imgsrc.baidu.com/forum/w%3D580/sign=fd030bb29edda144da096cba82b6d009/bcf3d7ca7bcb0a4603cb24986263f6246a60afa3.jpg
var downLoadImg = function(image_url) { //下载图片
	let name = "./image/" + image_url.split("/").reverse()[0].split("?")[0],
		imgData = '',
		method = null,
		localpath = '',
		deferred = q.defer()
	method = chooseProtocol(image_url)
	method.get(image_url, (res) => {
		let n = ++count
		console.log(`正在抓取第${n}张 : ${name}`)
		res.setEncoding('binary')
		res.on('data', (chunk) => {
			imgData += chunk
		})
		res.on('end', () => {
			localpath = path.resolve(__dirname, name)
			fs.writeFile(localpath, imgData, "binary", (err) => {
				if (!err) {
					// console.log(`抓取成功！ `)
					console.log(`第${n}张 : 抓取成功！`)
					deferred.resolve()
				} else {
					console.log(`第${n}张 : 抓取失败！`)
						// deferred.rejected()
					deferred.resolve()
				}
			})
		})
	})
	return deferred.promise
}

// downLoadImg("http://imgsrc.baidu.com/forum/w%3D580/sign=fd030bb29edda144da096cba82b6d009/bcf3d7ca7bcb0a4603cb24986263f6246a60afa3.jpg")

//e.g http://tieba.baidu.com/p/4972127955
//返回每个帖子中所有的图片的地址
var allUrlsOfImg_Page = function(page_url, callback) {
	let method = null,
		body = '',
		image_urls = [],
		deferred = q.defer()
	method = chooseProtocol(page_url)
	method.get(page_url, (res) => {
		res.on('data', (chunk) => {
			body += chunk
		})
		res.on('end', () => {
			image_urls = getImgUrl(body)
				// console.log(image_urls)
			deferred.resolve(image_urls)
				// return image_urls
		})
	})
	return deferred.promise
}

//获取每页的url
var getEveryPageUrl = function(url, max) {
	let everyPageUrl = [],
		n = 0,
		host = '',
		query = ''
	host = url.split("?")[0]
	query = url.split("kw")[1].split("&")[0].slice(1)
	urlCode = host + "?kw=" + query + "&ie=utf-8&pn="
	while (n <= max) {
		everyPageUrl.push(urlCode + n * 50)
		n += 1
	}
	// console.log(everyPageUrl)
	return everyPageUrl
}

// allUrlsOfImg_Page("http://tieba.baidu.com/p/5016314264")
// downLoadImg("http://imgsrc.baidu.com/forum/w%3D580/sign=fd030bb29edda144da096cba82b6d009/bcf3d7ca7bcb0a4603cb24986263f6246a60afa3.jpg")

var startCatch = function() { //开始抓取
	let everyUrl = [],
		pageUrls = [],
		tieba_url = '',
		maxPage = ''

	tieba_url = readCfgUrls()
	getMaxPage(tieba_url).then((max) => {
		// console.log(tieba_url)
		console.log(max)
		console.log(tieba_url)
		everyUrl = getEveryPageUrl(tieba_url, max)
			// console.log(everyUrl)
		async.eachLimit(everyUrl, 1, (url, url_callback) => {
			getPageUrl(url).then((urls) => {
				// console.log(urls)
				pageUrls = urls
				async.eachLimit(pageUrls, 1, (pageurl, pageUrls_callback) => {
					allUrlsOfImg_Page(pageurl).then((imgUrls) => {
						console.log(imgUrls)
						if (imgUrls.length) {
							async.eachLimit(imgUrls, 1, (imgurl, imgUrls_callback) => {
								downLoadImg(imgurl).then(() => {
									imgUrls_callback()
								})
							}, () => {
								pageUrls_callback()
								console.log("该帖子所有图片抓取完毕!")
							})
						} else {
							pageUrls_callback()
							console.log("该帖子所有图片抓取完毕!")
						}
					})
				}, () => {
					url_callback()
				})
			})
		})

		// async.eachLimit(everyUrl, 1, (url, callback) => {
		// 	getPageUrl(pageUrls).then((urls) => {
		// 		// console.log(urls)
		// 		pageUrls = url
		// 	})
		// })
	})
}


// configInit()
// url = readCfgUrls()
startCatch()

// console.log(url)
// getMaxPage(url)
// https.get(url, (res) => {
// 	console.log(res.statusCode)
// })

// console.log(url)
// console.log(querystring.parse(url))

module.exports = {
	getEveryPageUrl,
	allUrlsOfImg_Page,
	getMaxPage,
	getPageUrl,
	getImgUrl,
	readCfgUrls,
	downLoadImg
}