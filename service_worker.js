// キャッシュファイルの指定
var CACHE_NAME = "pwa-sample-caches";
var urlsToCache = ["/runstackjp.github.io/"];

// インストール処理
self.addEventListener("install", function (event) {
  console.log("ServiceWorker install");
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

/*
想定パターン
既に検索したことのある検索条件の

フェッチパターンとしては、キャッシュのみ、キャッシュ＋ネットワーク等のパターンがあるが、
キャッシュ＋ネットワークを試す。
*/

// [メモ]ただリクエストをネットワークにフォールバックさせたい時は"fetch"のfunction内でただreturnすればいい。event.respondWith(fetch(event.request))は不要。
// [メモ] respondWithを実行しない場合、リクエストはブラウザによって処理される（つまりServiceWorkerが関与していないかのように処理される）

// リソースフェッチ時のキャッシュロード処理
self.addEventListener("fetch", function (event) {
  console.log("fetch");
  // 検索(オフライン対応)のリクエストの場合
  if (event.request.url.indexOf("https://httpbin.org") != -1) {
    console.log("fetch if");
    /* レスポンス編集
         * 以下の優先度でデータを返す。
         * 1.ネットワークリクエストデータ
         * 2.キャッシュデータ
         * 3.ブラウザDBから検索したデータ
         */
    event.respondWith(
      // １．ネットワークリクエスト実行
      fetch(event.request)

        // ２．ネットワークリクエストが成功した場合
        .then(response => {
          console.log("fetch response return");
          // キャッシュに追加
          return caches.open("CACHE_NAME").then(function (cache) {
            cache.put(event.request, response.clone());
            return response;
          })
        })
        // ３．ネットワークリクエストが失敗した場合
        .catch(function (error) {
          // キャッシュにデータがあるかチェック
          return caches.match(event.request).then(function (response) {
            // データあり
            if (response) {
              console.log("fetch caches.match キャッシュあり response return");
              // キャッシュのデータを返す
              return response;
            } else {
              console.log("fetch caches.match キャッシュなし!!! new response return");
              // データなし
              var init = { "status": 201, "statusText": "SuperSmashingGreat!" };
              var myResponse = new Response(null, init);
              // ステータス201で返す
              return myResponse;
            }
          });
        })
    );
  } else {
    // その他のリクエストの場合
    // ※このサンプルだと画面にアクセスした時のリクエストが該当する
    event.respondWith(
      // キャッシュにリクエストがあればキャッシュからレスポンスを返す。無い場合は、ネットワークからレスポンスを取得して返す。
      caches.match(event.request).then(function (response) {
        console.log("fetch else. return cacheResponse or fetch(event.request);");
        return response ? response : fetch(event.request);
      })
    );
  }
});
