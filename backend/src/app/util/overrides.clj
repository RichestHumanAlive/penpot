;; This Source Code Form is subject to the terms of the Mozilla Public
;; License, v. 2.0. If a copy of the MPL was not distributed with this
;; file, You can obtain one at http://mozilla.org/MPL/2.0/.
;;
;; Copyright (c) KALEIDOS INC

(ns app.util.overrides
  "A utility ns for declare default overrides over clojure runtime"
  (:require
   [app.common.schema :as sm]
   [app.common.schema.openapi :as-alias oapi]
   [clojure.pprint :as pprint]
   [datoteka.fs :as fs]))

(prefer-method print-method
               clojure.lang.IRecord
               clojure.lang.IDeref)

(prefer-method print-method
               clojure.lang.IPersistentMap
               clojure.lang.IDeref)

(prefer-method pprint/simple-dispatch
               clojure.lang.IPersistentMap
               clojure.lang.IDeref)

(sm/register! ::fs/path
  {:type ::fs/path
   :pred fs/path?
   :type-properties
   {:title "path"
    :description "Filesystem Path instance"
    :error/message "invalid path"
    :error/code "errors.invalid-path"
    ::oapi/type "string"
    ::oapi/format "kakota"
    ::oapi/decode (fn [value]
                    (fs/path value))}})
