# 生活工具箱 | Life Toolbox

---

## 中文

### 工具列表

#### 1. 章节序号检测
检测章节编号的连续性，自动识别缺失、排序错误与重复章节，支持「第X章」和行末「（序号）」两种格式。

#### 2. 中英标点转换
快速将文本中的标点符号在中文和英文格式之间转换，支持全角半角标点互换，包含常用标点的双向转换。

#### 3. 汇率转换
实时获取全球主要货币汇率，支持100+种货币转换，数据来源于Frankfurter API，提供准确的国际汇率。

#### 4. 电子书阅读器
加载本地 TXT / EPUB 电子书，自动识别章节目录，支持书架管理、字体调节、阅读进度记忆与章节内百分比进度。

#### 5. 游戏公测时间线
跟踪尚未公测的联网游戏，以垂直时间轴按日期串联游戏卡片，卡片采用左中右三栏布局：左侧游戏 Logo，中间游戏名称、公测时间、运营厂商、游戏类型、游戏引擎与官网链接，右侧宣传图。游戏数据集中存放在 `tools/game-timeline/games.json`，网页打开时直接加载并渲染，支持年份筛选与时间正序 / 倒序切换。尚未定档的游戏会归入时间线末尾的「待定」分组。请通过本地 HTTP 服务打开页面（可运行根目录的 `start_server.bat`），直接双击 HTML 会被浏览器拦截 JSON 读取。

---

## English

### Tool List

#### 1. Chapter Number Checker
Detects continuity of chapter numbering, automatically identifies missing, incorrectly sorted, and duplicate chapters. Supports both "第X章" and end-of-line "(number)" formats.

#### 2. Chinese-English Punctuation Converter
Quickly converts punctuation marks in text between Chinese and English formats. Supports full-width and half-width punctuation swapping, including bidirectional conversion of common punctuation.

#### 3. Currency Converter
Real-time exchange rates for major global currencies. Supports 100+ currency conversions, data sourced from Frankfurter API, providing accurate international exchange rates.

#### 4. E-book Reader
Load local TXT / EPUB e-books with automatic chapter and table-of-contents recognition. Features bookshelf management, font size adjustment, reading progress memory, and in-chapter percentage progress.

#### 5. Game Public Beta Timeline
Tracks online games that have not yet entered public beta. A vertical timeline links game cards by public beta date. Each card uses a three-column layout: game logo on the left; name, public beta date, publisher, genre, engine, and official website in the middle; promotional artwork on the right. Game data is maintained in `tools/game-timeline/games.json` and loaded directly when the page opens, with year filtering and ascending / descending time sorting.
