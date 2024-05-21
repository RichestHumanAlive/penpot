;; This Source Code Form is subject to the terms of the Mozilla Public
;; License, v. 2.0. If a copy of the MPL was not distributed with this
;; file, You can obtain one at http://mozilla.org/MPL/2.0/.
;;
;; Copyright (c) KALEIDOS INC

(ns app.main.ui.workspace.shapes.text.new-editor
  (:require
   [app.common.data.macros :as dm]
   [app.common.geom.shapes :as gsh]
   [app.common.geom.shapes.text :as gst]
   [app.common.math :as mth]
   [app.common.text :as text]
   [app.main.data.workspace.texts :as dwt]
   [app.main.refs :as refs]
   [app.util.dom :as dom]
   [rumext.v2 :as mf]))

;; TODO: Esto debería moverlo a DOM
(defn create-element
  ([tag]
   (create-element tag nil nil))
  ([tag attribs]
   (create-element tag attribs nil))
  ([tag attribs children]
   (let [element (dom/create-element tag)]
     (when (iterable? attribs)
       (doseq [[name value] attribs]
         (.setAttribute element name value)))

     (when (some? children)
       (js/console.log "children" children)
       (cond
         (string? children)
         (set! (.-textContent element) children)

         (iterable? children)
         (doseq [child children]
           (do (js/console.log "whatever" child)
               (.appendChild element child)))))

     element)))

(defn content-v1->dom
  "Using a `content-v1` node creates a series of DOM nodes"
  [node]
  (prn "type" (:type node))
  (cond
    (= "root" (:type node))
    (create-element "div" [["data-type" "root"]]
                    (mapv #(content-v1->dom %) (:children node)))

    (= "paragraph-set" (:type node))
    (create-element "div" [["data-type" "paragraph-set"]]
                    (mapv #(content-v1->dom %) (:children node)))

    (= "paragraph" (:type node))
    (create-element "div" [["data-type" "paragraph"]]
                    (mapv #(content-v1->dom %) (:children node)))

    :else
    (dom/create-text (:text node))))

(defn dom->content-v1
  "Using a DOM node returns a `content-v1` compatible structure"
  [node]
  )

(mf/defc text-editor-html
  "Text editor (HTML)"
  {::mf/wrap [mf/memo]
   ::mf/wrap-props false}
  [{:keys [shape] :as props}]
  (let [content (:content shape)
        text-editor-ref (mf/use-ref nil)

        on-paste (fn [e] (js/console.log (.-type e) e))
        on-copy (fn [e] (js/console.log (.-type e) e))
        on-cut (fn [e] (js/console.log (.-type e) e))
        on-blur (fn [e] (js/console.log (.-type e) e))
        on-focus (fn [e] (js/console.log (.-type e) e))
        on-input (fn [e] (js/console.log (.-type e) e))
        on-before-input (fn [e] (js/console.log (.-type e) e))]

    ;; Initialize text editor content.
    ;; TODO: Instead of using dom/set-text! we're going to use a custom
    ;; set-html! that sanitizes input (so it can be used in paste
    ;; events).
    (mf/with-effect
      [text-editor-ref]
      (let [text-editor (mf/ref-val text-editor-ref)]
        (when (some? text-editor)
          (let [content-root (content-v1->dom content)]
            (dom/append-child! text-editor content-root))
          (dom/focus! text-editor))))

    #_(prn "text-editor" id content shape)
    [:div.text-editor.v2
     {:ref text-editor-ref
      :content-editable true
      :role "textbox"
      :aria-multiline true
      :aria-autocomplete "none"
      :on-paste on-paste
      :on-copy on-copy
      :on-cut on-cut
      :on-blur on-blur
      :on-focus on-focus
      :on-before-input on-before-input
      :on-input on-input}]))

;;
;; Text Editor Wrapper
;; This is an SVG element that wraps the HTML editor.
;;
(mf/defc text-editor
  "Text editor wrapper component"
  {::mf/wrap [mf/memo]
   ::mf/wrap-props false
   ::mf/forward-ref true}
  [{:keys [shape] :as props} _]
  (let [shape-id  (dm/get-prop shape :id)

        clip-id   (dm/str "text-edition-clip" shape-id)

        text-modifier-ref
        (mf/use-memo (mf/deps (:id shape)) #(refs/workspace-text-modifier-by-id (:id shape)))

        text-modifier
        (mf/deref text-modifier-ref)

        shape (cond-> shape
                (some? text-modifier)
                (dwt/apply-text-modifier text-modifier))

        bounds (gst/shape->rect shape)

        _ (prn "shape.x" (:x shape) "bounds.x" (:x bounds))

        x      (mth/min (dm/get-prop bounds :x)
                        (dm/get-prop shape :x))
        y      (mth/min (dm/get-prop bounds :y)
                        (dm/get-prop shape :y))
        width  (mth/max (dm/get-prop bounds :width)
                        (dm/get-prop shape :width))
        height (mth/max (dm/get-prop bounds :height)
                        (dm/get-prop shape :height))]

    [:g.text-editor {:clip-path (dm/fmt "url(#%)" clip-id)
                     :transform (dm/str (gsh/transform-matrix shape))}
     [:defs
      [:clipPath {:id clip-id}
       [:rect {:x x :y y :width width :height height}]]]

     [:foreignObject {:x x :y y :width width :height height}
      [:& text-editor-html {:shape shape
                            :key (dm/str shape-id)}]]]))

