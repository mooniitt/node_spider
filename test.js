const assert = require('assert')
var spider = require('./index.js')
const async = require("async")

const url = require("./cfg.json").urls[0]
	// describe("Array", () => {
	// 	describe("#indexOf", () => {
	// 		it('should return -1', () => {
	// 			assert.equal(-1, [1, 2, 3].indexOf(4))
	// 		})
	// 	})
	// })
	// describe("从配置项返回需要爬取的贴吧地址", () => {
	// 	describe("最大页数", () => {
	// 		it('the max pages is 257', () => {
	// 			// assert.equal('257', spider.getMaxPage(url))
	// 			spider.getMaxPage(url, (max) => {
	// 				assert.equal('257', max)
	// 			})
	// 		})
	// 	})
	// })
	// console.log(spider.getEveryPageUrl(url, 257)[257])

// spider.getPageUrl("http://tieba.baidu.com/f?kw=%E5%AE%8B%E6%99%BA%E5%AD%9D&ie=utf-8&pn=1850")
// spider.allUrlsOfImg_Page("https://tieba.baidu.com/p/5115172638")
// spider.downLoadImg("https://imgsa.baidu.com/forum/w%3D580/sign=e12bf601efdde711e7d243fe97efcef4/7cee0730e924b8999d483f3c64061d950b7bf690.jpg")
// spider.downLoadImg("https://imgsa.baidu.com/forum/w%3D580/sign=e12bf601efdde711e7d243fe97efcef4/7cee0730e924b8999d483f3c64061d950b7bf690.jpg")

let urls = []
for (var i = 0; i < 100; i++) {
	urls.push("https://imgsa.baidu.com/forum/w%3D580/sign=e12bf601efdde711e7d243fe97efcef4/7cee0730e924b8999d483f3c64061d950b7bf690.jpg")
}
async.eachLimit(urls, 5, (img, callback) => {
	spider.downLoadImg(img, callback)
})