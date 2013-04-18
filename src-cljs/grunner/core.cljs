(ns grunner.core)

(defn clj->js
  "Recursively transforms ClojureScript maps into Javascript objects,
   other ClojureScript colls into JavaScript arrays, and ClojureScript
   keywords into JavaScript strings."
  [x]
  (cond
   (string? x) x
   (keyword? x) (name x)
   (map? x) (.-strobj (reduce (fn [m [k v]]
                                (assoc m (clj->js k) (clj->js v))) {} x))
   (coll? x) (apply array (map clj->js x))
   :else x))

(def data (atom {:player {:x 500 :y 200 :vx 100 :vy 0 :jumping 0} :view {:x 0 :y 0} :score 0 :dead? false}))
(def gee (atom nil))
(def ctx (atom nil))

(defn circle [x y radx rady]
  (.save @ctx)
  (.scale @ctx 1.0 (/ rady radx))
  (.beginPath @ctx)
  ;;(.moveTo @ctx x y)
  (.arc @ctx x (/ (* y radx) rady) radx 0 (* 2.0 Math/PI) true)
  (.closePath @ctx)
  (.fill @ctx)
  (.restore @ctx))

(defn line [x1 y1 x2 y2]
  (.beginPath @ctx)
  (.moveTo @ctx x1 y1)
  (.lineTo @ctx x2 y2)
  (.closePath @ctx)
  (.stroke @ctx))

(defn line2 [x1 y1 x2 y2]
  (.moveTo @ctx x1 y1)
  (.lineTo @ctx x2 y2))

(defn rectangle2 [x1 y1 x2 y2]
  (.moveTo @ctx x1 y1)
  (.lineTo @ctx x2 y1)
  (.lineTo @ctx x2 y2)
  (.lineTo @ctx x1 y2))

(defn on-screen? [{x :x y :y}]
  (let [width (. @gee -width)
        height (. @gee -height)]
    (and (< 0 (inc x))
         (< x (inc width))
         (< 0 (inc y))
         (< y (inc height)))))

(defn seeded-rand-int [x n]
  (let [alea (new js/Alea x)
        int-generator (. alea -uint32)]
    (mod (int-generator) n)))

(defn width-stream [[previous-x previous-width previous-height]]
  (* 20 (inc (seeded-rand-int previous-x 8))))

(defn height-stream [[previous-x previous-width previous-height]]
  (let [new-height (+ previous-height (- (* 10 (seeded-rand-int previous-x 10)) 50))]
    (if (< new-height 0)
      0
      new-height)))

(defn level-stream [previous]
  (let [x (first previous)
        width (width-stream previous)
        height (height-stream previous)]
    (lazy-seq (cons [x width height] (level-stream [(+ x width) width height])))))

(def level-data (take 1000 (level-stream [0 100 100])))

(defn test []
  (.log js/console (str level-data)))

(defn get-level-data [x w]
  (loop [x x
         w w
         lx 0
         cw 0
         datas level-data
         return []]
    (let [[cx width height] (first datas)]
      (if (<= w cw)
        return
        (if (<= x (+ cx width))
          (recur x w (+ cx width) (+ cw width) (rest datas) (conj return [cx width height]))
          (recur x w (+ cx width) cw (rest datas) return)
          )))))

(defn collides-with-level? [x y]
  (let [[lx width height] (first (get-level-data x 1))]
    (< y height)))

(defn on-ground? [x y]
  (let [[lx width height] (first (get-level-data x 1))]
    (<= y (+ height 1.5))))

(defn simulate []
  (let [{x :x y :y vx :vx vy :vy jump? :jump? jumping :jumping} (@data :player)
        dt (/ 1.0 60.0)
        ax 100
        ay (* -9.81 100.0)
        ground? (on-ground? x y)
        jvy (if (and jump? ground?) (* (Math/min (+ jumping 2) 8) 100) 0)
        nvx (+ vx (* ax dt))
        nvy (+ vy jvy (* ay dt))
        nx (+ x (* nvx dt))
        ny (+ y (* nvy dt))
        vvx (Math/max (get-in @data [:view :vx] 1) (* nvx dt))
        [lx width height] (first (get-level-data x 1))
        min-view-x 500
        [x y vx vy collided?] (if (collides-with-level? nx ny)
                                (if (collides-with-level? nx y)
                                  (if (collides-with-level? x ny)
                                    [x y 0 (if (< nvy 0) 0 nvy) true]
                                    [x ny 0 nvy true])
                                  [nx (if (< ny height) height y) nvx 0 true])
                                [nx ny nvx nvy false])]
    (swap! data (fn [] (assoc-in @data [:player :x] x)))
    (swap! data (fn [] (assoc-in @data [:player :y] y)))
    (swap! data (fn [] (assoc-in @data [:player :vx] vx)))
    (swap! data (fn [] (assoc-in @data [:player :vy] vy)))
    (when (>= jumping 0)
      (swap! data (fn [data] (update-in data [:player :jumping] inc))))
    (when (or jump?);; (not ground?))
      (swap! data (fn [data] (assoc-in data [:player :jumping] 0))))
    (swap! data (fn [data] (assoc-in data [:player :jump?] false)))
    (swap! data (fn [data] (update-in data [:view :vx] max vvx)))
    (swap! data (fn [data] (update-in data [:view :x] (fn [old] (if (< (+ old min-view-x) x) (- x min-view-x) (+ old vvx))))))
    (when (< x (get-in @data [:view :x]))
      (swap! data (fn [] (assoc-in @data [:dead?] true))))
    (swap! data (fn [] (assoc-in @data [:score] (Math/round x))))
    ))

(defn draw []
  (when-not (@data :dead?)
    (simulate))

  (let [screen-width (. @gee -width)
        screen-height (. @gee -height)
        view-x (get-in @data [:view :x])]
    (set! (. @ctx -fillStyle) "rgb(70, 75, 75)")
    (.fillRect @ctx 0 0 screen-width screen-height)

    (set! (. @ctx -fillStyle) "rgb(255, 255, 255)")
    (set! (. @ctx -strokeStyle) "rgba(255, 255, 255, 0.2)")

    (set! (. @ctx -fillStyle) "rgb(255, 255, 255)")
    (set! (. @ctx -font) "bold 30px sans-serif")
    (set! (. @ctx -textAlign) "left")
    (set! (. @ctx -textBaseline) "middle")
    (set! (. @ctx -font) "20pt Courier New")
    (.fillText @ctx (str "fps " (Math/round (. @gee -frameRate))) 50 20)
    (.fillText @ctx (str "score " (@data :score)) 50 50)
    (.fillText @ctx (str "jumping " (get-in @data [:player :jumping])) 50 80)
    (set! (. @ctx -font) "normal 18px sans-serif")
    ;;(.fillText @ctx (str "x " (Math/round (get-in @data [:player :x]))) 50 80)
    ;;(.fillText @ctx (str "vx " (Math/round (get-in @data [:view :x]))) 100 80)
    ;;(.fillText @ctx (str "h " (second (get-level-data (get-in @data [:player :x]) 1))) 50 110)

    (set! (. @ctx -strokeStyle) "rgb(255, 255, 255)")
    (set! (. @ctx -fillStyle) "rgb(255, 255, 255)")
    (let [levels (get-level-data view-x (* 1.5 screen-width))]
      (dorun (map (fn [[x width height]]
                    (let [x (- x view-x)]
                      (.beginPath @ctx)
                      (rectangle2 x (- screen-height height 200) (+ x width) screen-height)
                      (.closePath @ctx)
                      (set! (. @ctx -fillStyle) "rgb(100, 100, 100)")
                      (.fill @ctx)
                      ;;(.fillText @ctx (str width "x" height) (+ x 15) (- screen-height height 200 15))
                      ))
                  levels)))

    (set! (. @ctx -strokeStyle) "rgb(255, 255, 255)")
    (set! (. @ctx -fillStyle) "rgb(255, 255, 255)")
    (let [{player-x :x player-y :y jumping :jumping} (@data :player)
          x (- player-x view-x)
          s (- 20 (Math/min jumping 5))]
      (circle x (- screen-height player-y 200 s) 15 15))

    (when (@data :dead?)
      (set! (. @ctx -textAlign) "center")
      (set! (. @ctx -font) "60pt Courier New")
      (.fillText @ctx (str "G A M E  O V E R") (/ screen-width 2) (/ screen-height 2)))

    ))

(defn move []
  (swap! data (fn [] (assoc @data :tx (. @gee -mouseX) :ty (. @gee -mouseY)))))

(defn keydown []
  (let [{x :x y :y jumping :jumping} (@data player)]
    (if (and (on-ground? x y)
             (= 0 jumping))
      (swap! data (fn [] (assoc-in @data [:player :jumping] 1))))))

(defn keyup []
  (swap! data (fn [] (assoc-in @data [:player :jump?] true))))

(defn start []
  (swap! gee (fn [] (new (. js/window -GEE)
                         (clj->js {:fullscreen true
                                   :context "2d"}))))
  (swap! ctx (fn [] (. @gee -ctx)))
  (set! (. @gee -draw) draw)
  (set! (. @gee -frameTime) "50")
  (set! (. @gee -keydown) keydown)
  (set! (. @gee -keyup) keyup)
  ;; (set! (. @gee -mousemove) move)
  ;; (set! (. @gee -mousedown) shoot)
  ;; (set! (. @gee -mouseup) noshoot)
  ;; (set! (. @gee -mousedrag) move)
  ;;(.appendChild (. js/document -body) (. gee -domElement)))
  )
