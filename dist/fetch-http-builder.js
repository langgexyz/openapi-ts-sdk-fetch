"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchHttpBuilder = void 0;
const openapi_ts_sdk_1 = require("openapi-ts-sdk");
/**
 * Fetch HTTP Builder 实现
 */
class FetchHttpBuilder extends openapi_ts_sdk_1.HttpBuilder {
    constructor(url) {
        super(url);
        // 在构建时检查 fetch 可用性
        if (typeof fetch === 'undefined') {
            throw new Error('Fetch API is not available in this environment. ' +
                'Please use a polyfill or switch to a different HTTP implementation.');
        }
    }
    build() {
        return {
            send: async () => {
                try {
                    const headers = Object.fromEntries(this.headers_);
                    let url = `${this.baseUrl_}${this.uri_}`;
                    const options = {
                        method: this.method_,
                        headers
                    };
                    // 对于 GET 请求，将 JSON 内容作为查询参数
                    if (this.method_ === openapi_ts_sdk_1.HttpMethod.GET && this.content_) {
                        try {
                            const params = JSON.parse(this.content_);
                            const searchParams = new URLSearchParams();
                            Object.entries(params).forEach(([key, value]) => {
                                searchParams.append(key, String(value));
                            });
                            url += `?${searchParams.toString()}`;
                        }
                        catch {
                            // 如果不是 JSON，忽略内容
                        }
                    }
                    else if (this.content_ && this.method_ !== openapi_ts_sdk_1.HttpMethod.GET) {
                        options.body = this.content_;
                    }
                    const response = await fetch(url, options);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    const data = await response.text();
                    return [data, null];
                }
                catch (error) {
                    const httpError = new Error(error.message || 'Fetch request failed');
                    // 添加更多错误信息
                    if (error.name) {
                        httpError.name = error.name;
                    }
                    return ['', httpError];
                }
            }
        };
    }
}
exports.FetchHttpBuilder = FetchHttpBuilder;
//# sourceMappingURL=fetch-http-builder.js.map