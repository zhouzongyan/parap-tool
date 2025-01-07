# [一个在图片最后隐藏内容的方案](https://tool.parap.us.kg/image-data)
起因是 [这个帖子:照片容量增大](https://www.52pojie.cn/forum.php?mod=viewthread&tid=1993466&extra=&highlight=%D5%D5%C6%AC)  
和我当初碰到情况一毛一样
看论坛已经有易语言写的了  
这里做了一个纯**js**版, 主要用于测试cursor的composer  

## 原理
简单来说就是
```
        return concatenateArrays(
            imageData,      // 原始图片数据
            processedData,  // 处理后的数据
            markerBytes,    // 标记
            extensionBytes, // 后缀名（8字节）
            lengthBytes     // 长度信息（8字节）
        )
```

## 很有意思的一点是
下面图片用上面的方式包含了一个66k的json文件,用的是B站的图床
```
https://i0.hdslb.com/bfs/article/38652f4695f0acb60741b9bc0567c924243700577.jpg
```
因为B站图片支持跨域,意味着你可以存一些东西,直接在前端里面用
[![pAj9iqI.png](https://s21.ax1x.com/2024/12/24/pAj9iqI.png)](https://imgse.com/i/pAj9iqI)
目前没有想到什么好玩的用法

纯前端项目
[源码地址](https://wwtw.lanzouq.com/igbo62ivdkrc)

[在线体验](https://tool.parap.us.kg/image-data)

## 后记
cursor的composer,确实厉害  
如果在完全不看代码的情况下,可以让一个小白,花费不少时间写成一个小项目
如果在能看懂代码的情况下,帮他debug几个他改不对的地方(或者说给给对Prompt),他的效率是真的高
前面源码中的完全没看,花了4个小时
后面用vue框架,帮他debug了2个问题,花了1个小时就搞定了

# [电话号码查询工具](https://tool.parap.us.kg/phone-number)
原贴[手机号码中间四位补齐工具](https://www.52pojie.cn/thread-1992709-1-1.html),但是他没给源码,且数据不全.  
该项目为纯js项目, 
[源码地址](https://github.com/pzx521521/parap-tool)
[在线demo](https://tool.parap.us.kg/phone-number)
![pAxwtOK.png](https://s21.ax1x.com/2024/12/29/pAxwtOK.png)
## 原理
以手机号138xxxx0000为例.xxxx是中间四位,可以根据地域信息确认.最后四位是随机值
![pAj9iqI.png](https://www.qqzeng-ip.com/res/phone-hf-new.webp)
[数据源](https://www.qqzeng.com/article/phone.html)
[mysql数据](https://github.com/dannyhu926/phone_location)

mysql数据源 city_code 是有问题的, 转换[参考](https://github.com/pzx521521/parap-tool/blob/master/public/compare.go)
mysql数据源 转换为json [参考](https://github.com/pzx521521/parap-tool/blob/master/public/convert.go)

# 支付宝和微信收款码二合一(图层合并)

网上看了一下,居然没有**开源免费**通过图层合并实现的.纯前端项目

[在线demo](https://tool.parap.us.kg/qr-merge)

html:  
https://wwtw.lanzouq.com/iTAhH2k8rx3e

[源码](https://github.com/pzx521521/parap-tool))

主要合并方式实现有三种：

+ 通过 UA 判断
+ 图片合并
+ 第三方支付平台接入

---

## UA（User Agent）判断

### 原理
根据访问者的 User Agent 信息判断访问者使用的 App（支付宝或微信）。
- 如果检测到 User Agent 包含微信标识，则跳转微信收款链接。
- 如果检测到 User Agent 包含支付宝标识，则跳转支付宝收款链接。

### 优点
- **实现简单**：只需一个中间页面进行 UA 判断并跳转。

  可以纯前端,把两个链接都包含在二维码中.

  也可以把数据放后端

### 缺点
- **UA 可能变更**：微信和支付宝的 User Agent 格式可能会更新。
- **微信不支持直接拉起**：需要客户长按识别二维码。
- **不稳定**：需要中间页面的服务器响应。服务器挂了就没办法使用
- **不安全**: 跑路还好,最多不能用.如果后台恶意修改代码,钱就没了

---
## 第三方支付平台接入

### 原理
通过接入第三方支付平台，使用它们提供的 API 同时支持支付宝和微信支付。
### 优点
- **功能丰富**：支持更多支付方式（如银联、信用卡）。
- **自动化程度高**：无需自行维护逻辑。

### 缺点
- **成本较高**：需要支付服务费或分成。
- **依赖第三方服务**：平台不可用时可能影响业务。



## 二维码合并

### 原理
通过二维码的纠错机制,即使有一部分二维码被覆盖,也能正确解析.

支付宝的链接是`https://qr.alipay.com/xxx`  

微信的链接是`wxp://xxxx`  

微信识别二维码偏向于从左到右识别,支付宝不搭理微信的链接`wxp://xxxx`

其实**不限于支付**,其他微信/支付宝扫码都可以这个搞

所以可以这么实现:

+ 把链接解析出来,然后用最高容错H(30%纠错),重新生成二维码
+ 把微信作为底层,支付宝放在上层的右下角
+ 顺时针旋转支付宝180°,防止微信优先识别支付宝二维码
+ 删除支付宝的一部分,防止微信优先识别支付宝二维码

### 优点
- **简单易用**：纯物理方式。没有服务器,不担心安全问题

### 缺点
- **兼容性有限**：就能两个,3个(比如)都实现不了。
- **抗污能力差**：如果涂黑了一部分,很容易导致用不了,不再像原生二维码那样有强大纠错能力。
- **微信拉起失败**:极少部分情况下微信还是会打开支付宝的链接

---


---

## 总结

| 方式                | 实现复杂度 | 安全性      | 费率 | 多平台            | 其他          |
|---------------------|------------|------------|----------|---------------------|---------------------|
| UA 判断             | 较简单      | 低         | 无       | 支持多个        | 微信不能直接拉起,需长按识别 |
| 图片合并            | 简单       | 低         | 无       | 仅支持2个     | 微信极少数情况下会打开支付宝的链接 |
| 第三方支付平台  | 较复杂     | 看第三方信誉    | 有       | 支持很多(比如直接银行卡) | 没有任何问题 |

