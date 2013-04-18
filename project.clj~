(defproject grunner "1.0.0-SNAPSHOT"
  :description "FIXME: write description"
  :dependencies [[org.clojure/clojure "1.3.0"]
                 [compojure "1.0.1"]
                 [hiccup "1.0.0-RC2"]
                 [ring/ring-jetty-adapter "1.1.0-RC1"]]
  :dev-dependencies [[lein-ring "0.4.5"]
                     [ring-serve "0.1.2"]]
  :plugins [[lein-cljsbuild "0.2.1"]
            [lein-swank "1.4.4"]]
  :cljsbuild {
              :builds [{
                        :source-path "src-cljs"
                        :compiler {
                                   :output-to "resources/public/js/cljs.js"
                                   :optimizations :whitespace
                                   :pretty-print true}}]}
  :ring {:handler grunner.core/app})
