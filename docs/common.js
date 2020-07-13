(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["common"],{

/***/ "./src/app/shared/common/services/countries.service.ts":
/*!*************************************************************!*\
  !*** ./src/app/shared/common/services/countries.service.ts ***!
  \*************************************************************/
/*! exports provided: CountriesService */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CountriesService", function() { return CountriesService; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/common/http */ "./node_modules/@angular/common/fesm5/http.js");
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm5/index.js");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var CountriesService = /** @class */ (function () {
    function CountriesService(http) {
        var _this = this;
        this.http = http;
        this.baseUrl = 'assets/';
        this.filename = 'countries.json';
        this.data = null;
        this.loadData().subscribe(function (result) {
            _this.data = result;
        });
    }
    CountriesService.prototype.getCountries = function () {
        return this.data;
    };
    CountriesService.prototype.getCode = function (n) {
        var index = this.data.find(function (_a) {
            var name = _a.name;
            return name === n;
        });
        return index.code;
    };
    CountriesService.prototype.getName = function (c) {
        return this.data.find(function (_a) {
            var code = _a.code;
            return code === c;
        }).name;
    };
    CountriesService.prototype.loadData = function () {
        var _this = this;
        if (this.data != null) {
            var observable = new rxjs__WEBPACK_IMPORTED_MODULE_2__["Observable"](function (observer) {
                observer.next(_this.data);
            });
            return observable;
        }
        return this.http.get(this.baseUrl + this.filename);
    };
    CountriesService = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injectable"])({
            providedIn: 'root',
        }),
        __metadata("design:paramtypes", [_angular_common_http__WEBPACK_IMPORTED_MODULE_1__["HttpClient"]])
    ], CountriesService);
    return CountriesService;
}());



/***/ }),

/***/ "./src/app/shared/common/services/languages.service.ts":
/*!*************************************************************!*\
  !*** ./src/app/shared/common/services/languages.service.ts ***!
  \*************************************************************/
/*! exports provided: LanguagesService */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LanguagesService", function() { return LanguagesService; });
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_common_http__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/common/http */ "./node_modules/@angular/common/fesm5/http.js");
/* harmony import */ var rxjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! rxjs */ "./node_modules/rxjs/_esm5/index.js");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var LanguagesService = /** @class */ (function () {
    function LanguagesService(http) {
        var _this = this;
        this.http = http;
        this.baseUrl = 'assets/';
        this.filename = 'languages.json';
        this.data = null;
        this.loadData().subscribe(function (result) {
            _this.data = result;
        });
    }
    LanguagesService.prototype.getCode = function (name) {
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].name == name)
                return this.data[i].code;
        }
        return '';
    };
    LanguagesService.prototype.getName = function (code) {
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].code == code)
                return this.data[i].name;
        }
        return '';
    };
    LanguagesService.prototype.loadData = function () {
        var _this = this;
        if (this.data != null) {
            var observable = new rxjs__WEBPACK_IMPORTED_MODULE_2__["Observable"](function (observer) {
                observer.next(_this.data);
            });
            return observable;
        }
        return this.http.get(this.baseUrl + this.filename);
    };
    LanguagesService = __decorate([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_0__["Injectable"])({
            providedIn: 'root',
        }),
        __metadata("design:paramtypes", [_angular_common_http__WEBPACK_IMPORTED_MODULE_1__["HttpClient"]])
    ], LanguagesService);
    return LanguagesService;
}());



/***/ })

}]);
//# sourceMappingURL=common.js.map