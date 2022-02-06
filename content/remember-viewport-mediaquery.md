//@D-Blog ---
title: CSSは完璧なのにメディアクエリが効かない時はviewport確認して！な話
permalink: remember-viewport-mediaquery
postedAt: 2022/02/06
author:
//---

## TL;DR
CSSは完璧なのにメディアクエリが効かない時、headタグに記述するViewportを書き忘れているかもしれません。
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
```

## まずビューポートってなんやねん

MDN公式のメディアクエリのページでは...
[linkcard](https://developer.mozilla.org/ja/docs/Web/CSS/Media_Queries/Using_media_queries)
「特定の特性 (画面の解像度や**ブラウザーのビューポートの幅など**) に応じてサイトやアプリを変更したいとき」に使うと書いてあります。

それでは、ビューポートって何者なんでしょう。
ブラウザは、液晶ではなく「ビューポート」という仮想的な範囲に対して描画した後、実際の画面に合うようなサイズでそれを描画します。
例えば、画面の幅を取得するとされている`document.documentElement.clientWidth`が返すのも、ビューポートの幅です。

## ビューポートが未指定だとどうなるの...？
ビューポートが未指定だと、**実際の液晶サイズに関わらず一定の値**を返すようになります。
こうすることで、端末ごとの表示が統一され、スマホの表示はただPCの表示を縮小させただけのような表示になるのです。
然しこれは、今回のようにメディアクエリを付けたいときは問題が出てしまいます.
<span style="font-size: 110%">だって横幅が小さくなってもビューポートの横幅は一定なんだもん。</div>

## しっかりと指定しよう
今まで呪文のように扱われていたかもしれませんが、これらの問題を改善するのがこいつだったのです。
```html
<meta name="viewport" content="width=device-width">
```
意味はまんまで、`viewportのwidth`を`device-width`にするよ...って感じですね。
Emmet(補完ツール)で出したHTMLの雛形にもついてきます。
今どきの開発をしていれば...これはよっぽどついてる...はずなんだけど...

## なんで忘れたの？
実はこれ、まさにこれを書いてるD-Blogで起きた問題なんです。
GitHub上の.mdからHTMLを自動生成していたので、ついつい忘れてしまいました...
まぁ、こういうレアケースもあるよということでした！以上！閉廷！
