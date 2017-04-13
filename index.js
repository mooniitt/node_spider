const request = require("request")
const progress = require("request-progress")
const async = require("async")
const fs = require("fs")
const del = require("del")
// const querystring = require('querystring')
let MAX = 10
// console.time()
// let url = "http://tieba.baidu.com/f?ie=utf-8&kw=%E8%B6%8A%E7%8B%B1&fr=search"
let url = ''
let count = 0
if(!fs.existsSync("./image")){
	fs.mkdirSync("./image")
}
del.sync("./image/*")
var readCfgUrls = function(){
	const config = require("./cfg")
	return config.url
}
// var content = new iconv('gb2312','UTF8').convert('%CB%CE%D6%C7%D0%A2').toString()
var getImgUrl = function(str){//获取每页url中的图片地址
	let reg = /Image".*?src=".*?"/g
	let s = str.match(reg),sf = []
	if(s){
		reg = /http.*?\"/
		for(let i in s){
			 s[i] = s[i].match(reg).join().slice(0,-1).trim()
		}
		reg = /baidu/
		for(let i in s){
			reg.test(s[i])?sf.push(s[i]):''
		}
		return sf
	}
	return []
}
var getPageUrl = function(str){//获取每页的url
	let reg = /p\/[0-9]*/g
	let s = str.match(reg)
	let uriCode = "https://tieba.baidu.com/"
	for(let i in s){
		s[i] = uriCode + s[i] 
	}
	return s
}
var getMaxPage = function(body){//获取最大的page页数
	let reg = /pn=.*last pag/g
	let s = body.match(reg).join().split("\"")[0].split('=')[1]/50
	return s
}

var configInit = function(){
	if(!fs.existsSync("./cfg.json")){
		console.log(`Not found cfg.json`)
		return
	}
	fs.readFile("./cfg.json",{encoding:"utf-8"},(err,data)=>{
		if(err)throw err
		if(JSON.parse(data).clearImageFile){
			fs.rmdir("./image",(err)=>{
				if(err)throw err
				console.log(`Image directory is removed`)
			})
		}
	})
}

//e.g http://imgsrc.baidu.com/forum/w%3D580/sign=fd030bb29edda144da096cba82b6d009/bcf3d7ca7bcb0a4603cb24986263f6246a60afa3.jpg
var downLoadImg = function(image_url,callback){//下载图片
		let name = "./image/"+image_url.split("/").reverse()[0].split("?")[0]
		progress(request(image_url))
		.on('error',(err)=>{
			console.log(err)
		})
		.on('end',()=>{
			console.log(`正在抓取第${++count}张 : ${name}`)
			callback()
		})
		.pipe(fs.createWriteStream(name))
}
// downLoadImg("http://imgsrc.baidu.com/forum/w%3D580/sign=fd030bb29edda144da096cba82b6d009/bcf3d7ca7bcb0a4603cb24986263f6246a60afa3.jpg")

//e.g http://tieba.baidu.com/p/4972127955
var allUrlsOfImg_Page = function(page_url,callback){
	request(page_url,(err,res,body)=>{
		if(err){
			console.log(err)
			return
		}
		let image_urls = getImgUrl(body)
		let len = image_urls.length
		async.each(image_urls,(url,cb)=>{
			downLoadImg(url,cb)
		},()=>{
			callback()
		})
	})
}

// allUrlsOfImg_Page("http://tieba.baidu.com/p/5016314264")
// downLoadImg("http://imgsrc.baidu.com/forum/w%3D580/sign=fd030bb29edda144da096cba82b6d009/bcf3d7ca7bcb0a4603cb24986263f6246a60afa3.jpg")

var startCatch = function(url,max){//开始抓取
	let everyUrl = [],page = 1
	request(url,(err,res,body)=>{
		err?console.log(err):()=>{return}
		max = max ? max : getMaxPage(body)//尾页是多少
		console.log(`抓取${max}页`)
		everyUrl = getEveryPageUrl(url,max)//获取每页的URL
		console.log(everyUrl)
		async.eachLimit(everyUrl,1,(url,callback)=>{
			request(url,(err,res,body)=>{
				let surl = []
				err?console.log(err):()=>{return}
				surl = getPageUrl(body)
				async.eachLimit(surl,6,(url,cb)=>{
					allUrlsOfImg_Page(url,cb)
				},()=>{
					// console.log(`第${page++}页抓取完毕!`)
					callback()
				})
			})
		},()=>{
			console.log(`结束`)
			console.time()
		})
	})
}
var getEveryPageUrl = function(url,max){//获取每页的url
	let everyPageUrl = [],n=1
	everyPageUrl.push(url)
	let urlCode = url+"&ie=utf-8&pn="
	while(n<max){
		everyPageUrl.push(urlCode+n*50)	
		n+=1
	}
	// console.log(everyPageUrl)
	return everyPageUrl
}
// configInit()
url = readCfgUrls()
startCatch(url,1)

