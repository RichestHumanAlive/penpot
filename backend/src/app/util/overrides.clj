;; This Source Code Form is subject to the terms of the Mozilla Public
;; License, v. 2.0. If a copy of the MPL was not distributed with this
;; file, You can obtain one at http://mozilla.org/MPL/2.0/.
;;
;; Copyright (c) KALEIDOS INC

(ns app.util.overrides
  "A utility ns for declare default overrides over clojure runtime"
  (:require
   [clojure.pprint :as pprint]))

(prefer-method print-method
               clojure.lang.IRecord
               clojure.lang.IDeref)

(prefer-method print-method
               clojure.lang.IPersistentMap
               clojure.lang.IDeref)

(prefer-method pprint/simple-dispatch
               clojure.lang.IPersistentMap
               clojure.lang.IDeref)
