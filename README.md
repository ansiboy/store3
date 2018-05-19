## 开发环境及技术

1. typescript reactjs bootstrap
2. VS Code 编辑器

## 程序运行

1. 安装 nodejs, typescript
2. 运行 grunt dev

注意：grunt dev 生产的 js 代码为 es6

## 程序压缩 

运行命令 grunt build

生产的 JS 为 es5

## 代码修改

在程序运行起来后，运行 tsc -w -p src
这条命令用于生成 js 代码,并且监视代码的，一旦代码改动，立即重新生成 JS

程序结构

代码放置在 src 文件夹
service.ts 用于和服务端对接，基本修改这个文件就可以了
errorHandel.ts 用于处理服务端的异常信息
modules 用来放置页面

