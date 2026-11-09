# 注音做法（認識乘法、列式練習共用）

- 字型：Bpmf Zihi Kai Std（ButTaiwan bpmfvs 規格，SIL OFL 1.1），只把用到的字內嵌在網頁裡。
  - 列式練習的字型叫 `PNM Bpmf`，認識乘法的叫 `MP Bpmf`。
- 破音字：在字的後面加異體字選擇子。U+E01E1 是第 2 個讀音，U+E01E2 是第 3 個讀音，以此類推。
  讀音順序以 bpmfvs 的 `phonetic/phonic_table_Z.txt` 為準，例如：數 → ㄕㄨˋ、ㄕㄨˇ…
- 認識乘法的讀音表：`mulpic.html` 參數區的 `WORDS`（詞，處理破音字）和 `ZY`（單字）。
- 「一」標變調（課本做法）：
  - 後面的字是四聲或輕聲 → ㄧˊ，例如一個、一次。
  - 後面是一、二、三聲 → ㄧˋ，例如一朵、一包。
  - 後面沒有字（句尾、標點、數字）→ ㄧ。
- 加新的字：先加進 `ZY` 或 `WORDS`，再重新產生字型的子集。字型來源是 npm 套件 `@expo-google-fonts/bpmf-zihi-kai-std` 的 TTF。
  ```
  pyftsubset BpmfZihiKaiStd_400Regular.ttf --text-file=chars.txt --unicodes=U+E01E0-E01E5,U+FF0C,U+FF1F,U+FF01,U+FF1A,U+300C,U+300D --flavor=woff2 --layout-features='*'
  ```
