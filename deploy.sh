#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

# 删除dist
# rm -r dist -f

# 生成编译后项目
npm run build:prod

# 进入生成的文件夹
cd ./dist

# 拷贝目录和文件（拷贝自动脚本）
cp -r ../.github ./

git init
git add -A
git commit -m 'deploy'

# 如果发布到 https://<USERNAME>.github.io/<REPO> 强制推送到gh-pages分支
git push -f git@github.com:smallyangy/growth-plan.git main:gh-pages

# 返回根目录
cd -