;; This Source Code Form is subject to the terms of the Mozilla Public
;; License, v. 2.0. If a copy of the MPL was not distributed with this
;; file, You can obtain one at http://mozilla.org/MPL/2.0/.
;;
;; Copyright (c) KALEIDOS INC

(ns app.main.ui.workspace.shapes.text.new-editor
  (:require
   ["./new_editor_impl.js" :as impl]
   [app.common.data.macros :as dm]
   [app.common.geom.shapes :as gsh]
   [app.common.geom.shapes.text :as gst]
   [app.common.math :as mth]
   [app.common.text :as text]
   [app.main.data.workspace :as dw]
   [app.main.data.workspace.texts :as dwt]
   [app.main.refs :as refs]
   [app.main.store :as st]
   [app.main.ui.css-cursors :as cur]
   [app.util.dom :as dom]
   [app.util.keyboard :as kbd]
   [goog.events :as events]
   [rumext.v2 :as mf]))

(mf/defc text-editor-html
  "Text editor (HTML)"
  {::mf/wrap [mf/memo]
   ::mf/wrap-props false}
  [{:keys [shape] :as props}]
  (let [content (:content shape)
        shape-id (:id shape)

        ;; This is a reference to the dom element that
        ;; should contain the TextEditor
        text-editor-ref (mf/use-ref nil)
        ;; This reference is to the container
        text-editor-container-ref (mf/use-ref nil)
        text-editor-instance-ref (mf/use-ref nil)

        on-blur
        (mf/use-fn
         (fn []
           (let [text-editor-instance (mf/ref-val text-editor-instance-ref)
                 container (mf/ref-val text-editor-container-ref)
                 new-content (js->clj (impl/getContent text-editor-instance))]
             (st/emit! (dwt/update-text-shape-content shape-id new-content true))
             (dom/set-style! container "opacity" 0))))

        on-focus
        (mf/use-fn
         (fn []
           (let [container (mf/ref-val text-editor-container-ref)]
             (dom/set-style! container "opacity" 1))))

        on-input
        (mf/use-fn
         (fn [e]
           (js/console.log (.-type e) e)
           (let [text-editor-instance (mf/ref-val text-editor-instance-ref)
                 new-content (js->clj (impl/getContent text-editor-instance))]
             (st/emit! (dwt/update-text-shape-content shape-id new-content false)))))

        on-change
        (mf/use-fn
         (fn []
           (let [text-editor-instance (mf/ref-val text-editor-instance-ref)
                 new-content (js->clj (impl/getContent text-editor-instance))
                 new-layout (js->clj (impl/layout text-editor-instance))]
             (st/emit! (dwt/update-text-shape-content shape-id new-content true))
             (st/emit! (dwt/update-text-shape-layout shape-id new-layout))
             (js/console.log "new-layout" new-layout)
             (js/console.log "new-content" new-content))))

        on-click
        (mf/use-fn
         (fn []
           (let [text-editor-instance (mf/ref-val text-editor-instance-ref)]
             (.focus text-editor-instance))))

        on-key-up
        (mf/use-fn
         (fn [e]
           (dom/stop-propagation e)
           (when (kbd/esc? e)
             (st/emit! :interrupt (dw/clear-edition-mode)))))]

    ;; Initialize text editor content.
    (mf/use-effect
     (mf/deps text-editor-ref)
     (fn []
       ;; NOTE: I don't like this. Too much initialization.
       (let [keys [(events/listen js/document "keyup" on-key-up)]
             text-editor (mf/ref-val text-editor-ref)
             text-editor-instance (impl/TextEditor. text-editor)]
         (mf/set-ref-val! text-editor-instance-ref text-editor-instance)
         (.addEventListener text-editor-instance "change" on-change)
         #_(st/emit! (dwt/update-editor text-editor-instance))
         (when (some? content)
           (impl/setContent text-editor-instance (clj->js content)
            #js {:selectAll true}))

         ;; NOTE: I don't like this. I would prefer
         ;; something more concise.
         (fn []
           (.removeEventListener text-editor-instance "change" on-change)
           (.dispose text-editor-instance)
           #_(st/emit! (dwt/update-editor nil))
           (doseq [key keys]
             (events/unlistenByKey key))))))

    [:div.text-editor-container.v2
     {:ref text-editor-container-ref
      :style {:width (:width shape)
              :height (:height shape)}
              ;; We hide the editor when is blurred because otherwise the selection won't let us see
              ;; the underlying text. Use opacity because display or visibility won't allow to recover
              ;; focus afterwards.
              ;; IMPORTANT! This is now done through DOM mutations (see on-blur and on-focus)
              ;; but I keep this for future references.
              ;; :opacity (when @blurred 0)}}
      :on-click on-click
      :class (dom/classnames
              (cur/get-dynamic "text" (:rotation shape)) true
              :align-top    (= (:vertical-align content "top") "top")
              :align-center (= (:vertical-align content) "center")
              :align-bottom (= (:vertical-align content) "bottom"))}

     [:div.text-editor-content
      {:ref text-editor-ref
       :content-editable true
       :role "textbox"
       :aria-multiline true
       :aria-autocomplete "none"
       :on-blur on-blur
       :on-focus on-focus
       :on-input on-input}]]))

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

