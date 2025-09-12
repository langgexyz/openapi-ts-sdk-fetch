// Fetch HTTP Builder 单元测试
const { FetchHttpBuilder } = require('../dist/index');
const { HttpMethod } = require('openapi-ts-sdk');

console.log('=== Fetch HTTP Builder 测试 ===');

// 1. 测试 FetchHttpBuilder 构建
console.log('\n1. FetchHttpBuilder 构建测试:');
try {
  const builder = new FetchHttpBuilder('https://api.example.com');
  
  const http = builder
    .setUri('/api/posts')
    .setMethod(HttpMethod.GET)
    .addHeader('Accept', 'application/json')
    .addHeader('User-Agent', 'fetch-test/1.0.0')
    .build();
    
  if (!http || typeof http.send !== 'function') {
    throw new Error('FetchHttpBuilder 应该返回包含 send 方法的对象');
  }
  
  console.log('✅ FetchHttpBuilder 构建成功');
} catch (error) {
  console.error('❌ FetchHttpBuilder 构建失败:', error.message);
}

// 2. 测试环境检查（如果 fetch 不可用）
console.log('\n2. Fetch 环境检查测试:');
try {
  // 保存原始的 fetch
  const originalFetch = global.fetch;
  
  // 临时删除 fetch
  delete global.fetch;
  
  try {
    const builder = new FetchHttpBuilder('https://api.example.com');
    console.log('⚠️  Fetch 环境检查可能不够严格');
  } catch (fetchError) {
    if (fetchError.message.includes('Fetch API is not available')) {
      console.log('✅ Fetch 环境检查正确');
    } else {
      console.error('❌ Fetch 环境检查错误:', fetchError.message);
    }
  }
  
  // 恢复 fetch
  global.fetch = originalFetch;
} catch (error) {
  console.error('❌ Fetch 环境检查测试失败:', error.message);
}

// 3. 测试 GET 请求参数构建
console.log('\n3. Fetch GET 参数构建测试:');
try {
  const builder = new FetchHttpBuilder('https://api.example.com');
  
  // Mock fetch 函数来检查构建的 URL
  const originalFetch = global.fetch;
  let capturedUrl = '';
  let capturedOptions = {};
  
  global.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return {
      ok: true,
      text: async () => '{"success": true}'
    };
  };
  
  const http = builder
    .setUri('/api/search')
    .setMethod(HttpMethod.GET)
    .setContent('{"q": "typescript", "limit": 5}')
    .addHeader('Authorization', 'Bearer test-token')
    .build();
    
  http.send().then(([response, error]) => {
    if (error) {
      console.error('❌ Fetch GET 参数构建失败:', error.message);
    } else {
      // 检查 URL 是否包含查询参数
      if (capturedUrl.includes('q=typescript') && capturedUrl.includes('limit=5')) {
        console.log('✅ Fetch GET 参数构建成功');
      } else {
        console.error('❌ Fetch GET 参数构建格式错误');
      }
    }
    
    // 恢复原始 fetch
    global.fetch = originalFetch;
  }).catch(err => {
    console.error('❌ Fetch GET 参数构建异常:', err.message);
    global.fetch = originalFetch;
  });
} catch (error) {
  console.error('❌ Fetch GET 参数构建测试失败:', error.message);
}

// 4. 测试 POST 请求构建
console.log('\n4. Fetch POST 请求构建测试:');
try {
  const builder = new FetchHttpBuilder('https://api.example.com');
  
  // Mock fetch 函数来检查构建的请求
  const originalFetch = global.fetch;
  let capturedOptions = {};
  
  global.fetch = async (url, options) => {
    capturedOptions = options;
    return {
      ok: true,
      text: async () => '{"created": true}'
    };
  };
  
  const http = builder
    .setUri('/api/users')
    .setMethod(HttpMethod.POST)
    .setContent('{"name": "Bob", "email": "bob@test.com"}')
    .addHeader('Content-Type', 'application/json')
    .build();
    
  http.send().then(([response, error]) => {
    if (error) {
      console.error('❌ Fetch POST 请求构建失败:', error.message);
    } else {
      // 检查请求体和方法
      if (capturedOptions.method === 'POST' && 
          capturedOptions.body === '{"name": "Bob", "email": "bob@test.com"}') {
        console.log('✅ Fetch POST 请求构建成功');
      } else {
        console.error('❌ Fetch POST 请求构建格式错误');
      }
    }
    
    // 恢复原始 fetch
    global.fetch = originalFetch;
  }).catch(err => {
    console.error('❌ Fetch POST 请求构建异常:', err.message);
    global.fetch = originalFetch;
  });
} catch (error) {
  console.error('❌ Fetch POST 请求构建测试失败:', error.message);
}

// 5. 测试 HTTP 错误响应处理
console.log('\n5. Fetch HTTP 错误响应测试:');
try {
  const builder = new FetchHttpBuilder('https://api.example.com');
  
  // Mock fetch 返回错误响应
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => '{"error": "Resource not found"}'
    };
  };
  
  const http = builder
    .setUri('/api/nonexistent')
    .setMethod(HttpMethod.GET)
    .build();
    
  http.send().then(([response, error]) => {
    if (error) {
      if (error.message.includes('HTTP 404')) {
        console.log('✅ Fetch HTTP 错误响应处理正确');
      } else {
        console.error('❌ Fetch HTTP 错误格式错误:', error.message);
      }
    } else {
      console.error('❌ Fetch 应该返回错误');
    }
    
    // 恢复原始 fetch
    global.fetch = originalFetch;
  }).catch(err => {
    console.error('❌ Fetch HTTP 错误响应异常:', err.message);
    global.fetch = originalFetch;
  });
} catch (error) {
  console.error('❌ Fetch HTTP 错误响应测试失败:', error.message);
}

// 6. 测试无效 JSON content 处理
console.log('\n6. Fetch 无效 JSON content 测试:');
try {
  const builder = new FetchHttpBuilder('https://api.example.com');
  
  // Mock fetch 函数
  const originalFetch = global.fetch;
  let capturedUrl = '';
  
  global.fetch = async (url, options) => {
    capturedUrl = url;
    return {
      ok: true,
      text: async () => '{"success": true}'
    };
  };
  
  const http = builder
    .setUri('/api/search')
    .setMethod(HttpMethod.GET)
    .setContent('invalid json content')  // 无效的 JSON
    .build();
    
  http.send().then(([response, error]) => {
    if (error) {
      console.error('❌ Fetch 无效 JSON 处理失败:', error.message);
    } else {
      // 应该忽略无效的 JSON，不添加查询参数
      if (capturedUrl === 'https://api.example.com/api/search') {
        console.log('✅ Fetch 无效 JSON content 正确忽略');
      } else {
        console.error('❌ Fetch 应该忽略无效 JSON content');
      }
    }
    
    // 恢复原始 fetch
    global.fetch = originalFetch;
  }).catch(err => {
    console.error('❌ Fetch 无效 JSON 处理异常:', err.message);
    global.fetch = originalFetch;
  });
} catch (error) {
  console.error('❌ Fetch 无效 JSON content 测试失败:', error.message);
}

// 7. 测试 Fetch 对真实服务（如果可用）
console.log('\n7. Fetch 真实服务测试:');
(async () => {
  try {
    const response = await fetch('https://httpbin.org/status/200', { 
      method: 'GET',
      timeout: 3000 
    });
    
    if (response.ok) {
      console.log('检测到 httpbin 可用，进行真实服务测试...');
      
      const builder = new FetchHttpBuilder('https://httpbin.org');
      const http = builder
        .setUri('/get')
        .setMethod(HttpMethod.GET)
        .addHeader('User-Agent', 'fetch-real-test/1.0.0')
        .build();
        
      const [realResponse, realError] = await http.send();
      
      if (realError) {
        console.error('❌ Fetch 真实服务测试失败:', realError.message);
      } else {
        console.log('✅ Fetch 真实服务测试成功');
      }
    } else {
      console.log('⚠️  httpbin 不可用，跳过真实服务测试');
    }
  } catch (error) {
    console.log('⚠️  无法连接真实服务，跳过测试');
  }
})();

// 8. Fetch 错误场景测试
console.log('\n8. Fetch 错误场景测试:');
(async () => {
  try {
    const originalFetch = global.fetch;
    const errorStatuses = [
      { status: 400, statusText: 'Bad Request' },
      { status: 401, statusText: 'Unauthorized' },
      { status: 404, statusText: 'Not Found' },
      { status: 500, statusText: 'Internal Server Error' }
    ];
    
    let successCount = 0;
    const builder = new FetchHttpBuilder('https://api.example.com');
    
    for (const errorStatus of errorStatuses) {
      global.fetch = async (url, options) => {
        return {
          ok: false,
          status: errorStatus.status,
          statusText: errorStatus.statusText,
          text: async () => `{"error": "${errorStatus.statusText}"}`
        };
      };
      
      const http = builder
        .setUri(`/api/error-${errorStatus.status}`)
        .setMethod(HttpMethod.GET)
        .build();
        
      const [response, error] = await http.send();
      
      if (error && error.message.includes(`HTTP ${errorStatus.status}`)) {
        successCount++;
      }
    }
    
    global.fetch = originalFetch;
    
    if (successCount === errorStatuses.length) {
      console.log('✅ Fetch HTTP 错误状态处理正确');
    } else {
      console.error(`❌ Fetch HTTP 错误状态处理失败: ${successCount}/${errorStatuses.length}`);
    }
    
  } catch (error) {
    console.error('❌ Fetch 错误场景测试失败:', error.message);
  }
})();

// 9. Fetch 环境兼容性测试
console.log('\n9. Fetch 环境兼容性测试:');
try {
  const hasFetch = typeof fetch !== 'undefined';
  
  if (hasFetch) {
    console.log('✅ Fetch API 可用');
    const builder = new FetchHttpBuilder('https://api.example.com');
    console.log('✅ FetchHttpBuilder 在支持环境中构建成功');
  } else {
    console.log('⚠️  Fetch API 不可用');
    
    try {
      const builder = new FetchHttpBuilder('https://api.example.com');
      console.log('⚠️  FetchHttpBuilder 在不支持环境中仍能构建');
    } catch (fetchError) {
      if (fetchError.message.includes('Fetch API is not available')) {
        console.log('✅ FetchHttpBuilder 正确检测环境不支持');
      }
    }
  }
  
} catch (error) {
  console.error('❌ Fetch 环境兼容性测试失败:', error.message);
}

console.log('\n=== Fetch HTTP Builder 测试完成 ===');
