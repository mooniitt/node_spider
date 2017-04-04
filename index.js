const request = require("request")
const progress = require("request-progress")
const async = require("async")
const fs = require("fs")
const config = require("./cfg")
const delay = require("delay")
const del = require("del")
const trim = require("trim")
const download = require('download')
const sq = require('sync-request')
let MAX = 10


let url = "http://tieba.baidu.com/f?kw=dota2&fr=search"
let count = 0
if(!fs.existsSync("./image")){
	fs.mkdirSync("./image")
}
del.sync("./image/*")
var  readCfgUrls = function(){

}

var getImgUrl = function(str){//获取每页url中的图片地址
	let reg = /Image".*?src=".*?"/g
	let s = str.match(reg),sf = []
	if(s){
		reg = /http.*?\"/
		for(let i in s){
			 s[i] = trim(s[i].match(reg).join().slice(0,-1))
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
// configInit()
// getUri(url)

//e.g http://imgsrc.baidu.com/forum/w%3D580/sign=fd030bb29edda144da096cba82b6d009/bcf3d7ca7bcb0a4603cb24986263f6246a60afa3.jpg
var downLoadImg = function(image_url,cb){//下载图片
		let name = "./image/"+image_url.split("/").reverse()[0].split("?")[0]
		// let writeable = fs.createWriteStream(name)
		// console.log(writeable)
		// request(image_url).pipe(writeable)
		// download(image_url).then((data)=>{
		// 	fs.writeFileSync(name,data)
		// request(image_url).pipe(fs.createWriteStream(name))
		// 	console.log(`正在抓取第${++count}张 : ${name}`)
		// })
		progress(request(image_url))
		.on('error',(err)=>{
			console.log(err)
		})
		.on('end',()=>{
			console.log(`正在抓取第${++count}张 : ${name}`)
			cb()
		})
		.pipe(fs.createWriteStream(name))
}
// var onePage = function(url){//请求图片
// 	request(url,(err,res,body)=>{
// 		err?console.log(err):()=>{return false}
// 		downLoadImg(getImgUrl(body))
// 	})
// }

//e.g http://tieba.baidu.com/p/4972127955
var allUrlsOfImg_Page = function(page_url,callback){
	request(page_url,(err,res,body)=>{
		if(err){
			console.log(err)
			return
		}
		let image_urls = getImgUrl(body)
		async.eachOfSeries(image_urls,(url,index,cb)=>{
			downLoadImg(url,cb)
			if(index == (image_urls-1)){
				callback()
			}
		})
	})
}

allUrlsOfImg_Page("http://tieba.baidu.com/p/4972127955")
// downLoadImg("http://imgsrc.baidu.com/forum/w%3D580/sign=fd030bb29edda144da096cba82b6d009/bcf3d7ca7bcb0a4603cb24986263f6246a60afa3.jpg")

var startCatch = function(url,max){//开始抓取
	let everyUrl = []
	request(url,(err,res,body)=>{
		err?console.log(err):()=>{return}
		max = max ? max : getMaxPage(body)//尾页是多少
		console.log(`抓取${max}页`)
		everyUrl = getEveryPageUrl(url,max)//获取每页的URL
		console.log(everyUrl)
		// everyUrl = [1,2,3,4,5,6,7,8,9,1,2,3,4,5,6,7,8,9]
		let surl = []
		async.eachLimit(everyUrl,1,(url,callback)=>{
			request(url,(err,res,body)=>{
				err?console.log(err):()=>{return}
				surl = getPageUrl(body)
				console.log(surl)
				let len = surl.length
				async.eachOfSeries(surl,(url,index,cb)=>{
					// console.log(url)
					// cb()
					allUrlsOfImg_Page(url,cb)
					// callback()
				})
			})
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

// startCatch(url,1)

