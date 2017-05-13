const assert = require('assert')
var spider = require('./index.js')
	// console.log(t)
	// var allurl = spider.getEveryPageUrl("http://tieba.baidu.com/f?kw=%CB%CE%D6%C7%D0%A2", 1)
	// const url = "https://tieba.baidu.com/f?kw=宋智孝"
const url = require("./cfg.json").urls[0]
describe("Array", () => {
	describe("#indexOf", () => {
		it('should return -1', () => {
			assert.equal(-1, [1, 2, 3].indexOf(4))
		})
	})
})

describe("从配置项返回需要爬取的贴吧地址", () => {
	describe("宋智孝", () => {
		it('https://tieba.baidu.com/f?kw=宋智孝', () => {
			assert.equal('https://tieba.baidu.com/f?kw=宋智孝', spider.readCfgUrls())
		})
	})

	// describe("最大页数", () => {
	// 	it('the max pages is 258', () => {
	// 		assert.equal('258', spider.getMaxPage(url))
	// 	})
	// })
})

spider.getMaxPage(url)