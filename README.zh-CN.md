# 时间序列、时空与统计学文献库

用于文献检索、来源核对和前期综述的中英文索引。仓库包含完整结构化数据、网页源码、采集脚本及测试。

[在线文献库](https://lcl5743.github.io/time-space-literature-library/) · [统计期刊](https://lcl5743.github.io/time-space-literature-library/journals.html?lang=zh) · [投稿截止](https://lcl5743.github.io/time-space-literature-library/deadlines.html?lang=zh) · [四大全主题](https://lcl5743.github.io/time-space-literature-library/journals.html?journal=core&lang=zh) · [版本下载](https://github.com/lcl5743/time-space-literature-library/releases)

## 数据概况

| 集合 | 记录数 | 有摘要 | 数据时间 |
| --- | ---: | ---: | --- |
| 时间序列与时空主题库 | 8,678 | 8,027 | 截至 2026-11-14 |
| 统计及相关期刊，52 本 | 104,889 | 30,552 | 截至 2026-10-25 |
| 其中统计四大 | 7,648 | 7,453 | 截至 2026-10-25 |

期刊覆盖 2010 年起的来源记录。统计四大保留全部主题，包含来源目录中的研究、讨论、综述及勘误等类型。两个集合可能交叠，不能直接相加视为去重后的论文总数。

网页支持按题名、作者、年份、会议/期刊、任务与研究方向筛选；时间序列、时空、空间和因果分别标注。详情页保留摘要、DOI、出版页面及元数据证据。筛选结果可导出 CSV/RIS，收藏与笔记保存在当前浏览器。

“投稿截止”页列出 27 个会议历年的摘要、论文、Rebuttal 与录用通知日期，可按领域筛选并导出日历。日期来自社区维护的公开清单，投稿前请以会议官网为准。

## 本地使用

需要 Node.js 22 或以上版本。

```bash
git clone https://github.com/lcl5743/time-space-literature-library.git
cd time-space-literature-library
npm ci
npm test
npm run dev
```

浏览器打开 `http://127.0.0.1:5173`。仅浏览时无需运行代码，在线版本由 GitHub Pages 托管，无需登录。

## 使用说明

- [数据字段](docs/DATA.md)：原始摘要、摘句、生成概述、引用数据及空缺值的区别。
- [覆盖进度](docs/COVERAGE.md)：各期刊数量、摘要完整度及来源核对状态。
- [采集方法](docs/METHODS.md)：来源、日期规则、去重与分类方式。
- [开发与复现](docs/DEVELOPMENT.md)：构建、测试和重新采集。
- [投稿截止](docs/DEADLINES.md)：截止时间的数据来源、字段和更新方式。

本库是文献索引，不代表已经逐篇精读或穷尽全部出版目录。自动主题标签及生成概述仍需结合原文核查，引用量也不等同于论文质量。第三方摘要与元数据的权利归原来源，见 [NOTICE.md](NOTICE.md)。

`v1.0.0` 为 2026-11-12 整理的公开分享版，未将数据采集日期改写为发布日期。2026-11-13 根据博主新发布的 13 篇文章补充 114 条记录：EMNLP 2026 论文 32 篇，ICLR 2027 在审投稿 82 篇（尚未录用）。2026-11-14 补充 122 篇原会议检索范围之外的关键论文：期刊论文、其他会议论文、预印本，以及研究者提供的阅读清单中的因果推断论文。
