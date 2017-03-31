const request = require("request")
const async = require("async")
const fs = require("fs")
const https = require("https")
let MAX = 10

let url = "http://tieba.baidu.com/f?kw=dota2&fr=search"
let count = 0
if(!fs.existsSync("./image")){
	fs.mkdirSync("./image")
}

var getImgUrl = function(str){//获取每页url中的图片地址
	let reg = /Image" src=".*?"/g
	let s = str.match(reg),sf = []
	if(s){
		reg = /http.*?\"/
		for(let i in s){
			 s[i] = s[i].match(reg).join().slice(0,-1)
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
var getMaxPage = function(str){//获取最大的page页数
	let reg = /pn=.*last pag/g
	let s = str.match(reg).join().split("\"")[0].split('=')[1]/50
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

var downLoadImg = function(data){//下载图片
	async.eachLimit(data,1,function(url,cb){
		let name = "./image/"+url.split("/").reverse()[0].split("?")[0]
		// let writeable = fs.createWriteStream(name)
		// request(url).on("response",(res)=>{
		// 	// console.log(err)
		// }).pipe(writeable)
		https.get(url,(res)=>{
			res.setEncoding('binary')
			let data = ''
			res.on("data",(chunk)=>{
				data += chunk
			}).on('end',()=>{
				fs.writeFile(name,data,{encoding:'binary'},(err)=>{
					err?console.log(err):()=>{return}
					console.log(`正在抓取第${++count}张 : ${name}`)
					cb()
				})
				
			}).on('error',(err)=>{
				console.log(err)
				cb()
				return
			})
		})
	})
}
var onePage = function(url){//请求图片
	request(url,(err,res,body)=>{
		err?console.log(err):()=>{return}
		downLoadImg(getImgUrl(body))
	})
}

var startCatch = function(url){//开始抓取
	let max = 0,everyUrl = []
	request(url,(err,res,body)=>{
		err?console.log(err):()=>{return}
		max = getMaxPage(body)//尾页是多少
		console.log(`抓取${max}页`)
		everyUrl = getEveryPageUrl(max,url)//获取每页的URL
		// console.log(everyUrl)
		async.eachLimit(everyUrl,1,function(uri,cb){//获取URL的子URL
			request(uri,(err,res,body)=>{
				err?console.log(err):()=>{return}
				let surl = getPageUrl(body)
				// console.log(surl)
				async.eachLimit(surl,1,(uri,cb)=>{
					onePage(uri)
					cb()
				})
			})
			cb()
		})
	})
}
var getEveryPageUrl = function(max,url){//获取每页的url
	let everyPageUrl = [],n=1
	everyPageUrl.push(url)
	let urlCode = url+"&ie=utf-8&pn="
	max = max>=1000?1000:max
	while(n<max){
		everyPageUrl.push(urlCode+n*50)	
		n+=1
	}
	// console.log(everyPageUrl)
	return everyPageUrl
}

startCatch(url)

