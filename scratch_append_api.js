const fs = require('fs');

const data = `1. How do you document REST APIs effectively?

Effective REST API documentation should help developers quickly understand how to interact with the system. I begin by explaining the purpose of the API and the use cases it supports. Each endpoint should clearly describe the HTTP method, endpoint URL, required parameters, and authentication requirements. Request and response examples help developers understand how the API behaves. Error codes and troubleshooting information should also be documented. Consistency in structure across endpoints improves readability. When possible, API documentation should be generated from OpenAPI specifications to ensure accuracy.

2. What is REST and why is it commonly used in APIs?

REST stands for Representational State Transfer and is an architectural style used for designing web APIs. REST APIs use standard HTTP methods such as GET, POST, PUT, and DELETE to perform operations on resources. Resources are typically represented using URLs. Responses are often formatted in JSON because it is lightweight and easy to process. REST APIs are widely used because they are simple, scalable, and compatible with web technologies. They allow systems to communicate over standard HTTP protocols.

3. What is OpenAPI (Swagger)?

OpenAPI is a specification used to describe REST APIs in a machine-readable format. It defines API endpoints, parameters, request structures, and response formats. Tools such as Swagger UI can automatically generate interactive API documentation from OpenAPI definitions. This allows developers to explore APIs and test endpoints directly from the documentation. OpenAPI also ensures consistency between API implementation and documentation. It is widely used in modern API-driven systems.

4. How does JSON work in API communication?

JSON, or JavaScript Object Notation, is a lightweight data format used for exchanging data between systems. In APIs, JSON is commonly used to send requests and receive responses. It represents data using key-value pairs and structured objects. Because JSON is easy to read and parse, it is widely supported across programming languages. API documentation should clearly describe JSON request bodies and response structures. Example payloads help developers understand how to format requests correctly.

5. What elements must every API endpoint documentation include?

Each API endpoint should include several essential elements. The endpoint URL identifies the resource being accessed. The HTTP method indicates the type of operation being performed. Authentication requirements explain how the request is authorized. Parameters describe the input values required by the API. The request body shows how data should be formatted. Response examples demonstrate expected outputs. Error responses help developers understand failure scenarios.

6. How would you structure developer documentation for an API platform?

Developer documentation should be organized in a logical structure that helps developers start quickly. I usually begin with an introduction explaining the API platform and its capabilities. Next, I include authentication instructions and environment setup guidance. A quick-start guide helps developers make their first API request. Detailed endpoint documentation explains how each API function works. Code examples in multiple languages help developers integrate faster. Finally, troubleshooting and FAQs address common issues.

7. How do you ensure API documentation stays synchronized with the API?

API documentation can easily become outdated if it is maintained manually. To prevent this, documentation should be generated from API specifications whenever possible. OpenAPI specifications allow documentation to be automatically updated when endpoints change. Continuous integration pipelines can rebuild documentation when API definitions are updated. Close collaboration with engineering teams ensures documentation updates are included in development workflows. Regular reviews help detect inconsistencies.

8. What challenges arise when documenting APIs?

API documentation often involves complex technical details that can be difficult for developers to understand quickly. Endpoints may change frequently during development. APIs may also depend on authentication mechanisms or external services. Another challenge is ensuring examples remain accurate as the API evolves. Documentation must also address different developer skill levels. Maintaining clarity while preserving technical accuracy requires careful structuring.

9. How do you document authentication mechanisms for APIs?

Authentication documentation should clearly explain how clients obtain and use authentication tokens. The documentation should describe the authentication method such as API keys, OAuth tokens, or JWT tokens. Step-by-step instructions should show how to authenticate requests. Example headers and token usage help developers implement authentication correctly. Security considerations should also be explained. Clear documentation reduces integration issues.

10. How do you provide code examples in API documentation?

Code examples help developers understand how to call APIs using real programming languages. I usually include examples in commonly used languages such as Python, JavaScript, or cURL. Each example should show how to construct the request and handle the response. Examples should be simple but realistic. Providing multiple language examples increases accessibility for different developer communities. Code samples should be tested to ensure they work correctly.

11. What is the difference between REST and SOAP APIs?

REST is an architectural style that uses HTTP methods and typically returns JSON responses. SOAP is a protocol that uses XML-based messaging and strict standards. REST APIs are generally simpler and more lightweight than SOAP APIs. REST is widely used in modern web applications because it is easier to integrate. SOAP is still used in some enterprise systems that require strict security or transactional standards.

12. What are HTTP status codes and why are they important in APIs?

HTTP status codes indicate the result of an API request. For example, a 200 status code indicates a successful request. A 400 code indicates a client error such as an invalid request. A 401 code indicates authentication failure. A 500 code indicates a server error. API documentation should clearly describe possible status codes and their meanings. This helps developers troubleshoot issues quickly.

13. How do you document API rate limits?

Rate limiting controls how many API requests clients can make within a specific time period. Documentation should clearly explain the request limits and time windows. It should also describe what happens when limits are exceeded. Example error responses help developers handle rate limit violations. Providing best practices helps developers design efficient integrations.

14. What is pagination in APIs?

Pagination is used when APIs return large datasets. Instead of returning all results at once, the API returns smaller pages of data. Parameters such as page number or cursor values control pagination. Documentation should explain how pagination works and how developers retrieve additional pages. This prevents performance issues and improves scalability.

15. What are webhooks and how would you document them?

Webhooks allow systems to send real-time notifications when specific events occur. Instead of polling the API repeatedly, clients receive automatic event updates. Documentation should explain the events available, payload structure, and security requirements. Example webhook payloads help developers understand the data they will receive. Instructions should also explain how to configure webhook endpoints.

16. What is idempotency in APIs?

Idempotency means that making the same API request multiple times produces the same result. For example, deleting a resource repeatedly should produce the same outcome after the first request. Idempotent operations help ensure reliability in distributed systems. API documentation should clarify which operations are idempotent. This helps developers design safe retry mechanisms.

17. What is API versioning?

API versioning allows developers to maintain compatibility while introducing new features. Version numbers are typically included in the API URL or headers. Documentation should clearly indicate which endpoints belong to each version. Deprecation policies should also be documented. Versioning ensures developers can migrate to new APIs smoothly.`;

const lines = data.split('\n');
const entries = [];
let currentQ = '';
let currentA = [];

for (const line of lines) {
  if (line.match(/^\d+\. /)) {
    if (currentQ) {
      entries.push({ q: currentQ, a: currentA.join('\n').trim() });
    }
    currentQ = line.replace(/^\d+\. /, '').trim();
    currentA = [];
  } else {
    currentA.push(line);
  }
}
if (currentQ) {
  entries.push({ q: currentQ, a: currentA.join('\n').trim() });
}

let resultStr = '';
let id = 116; // resuming from the last appended list
for (const entry of entries) {
  resultStr += `,
  {
    id: '${id++}',
    category: 'API',
    question: ${JSON.stringify(entry.q)},
    tips: [
      "Define exactly what the term or process means clearly.",
      "Give a specific example of how it applies to API documentation.",
      "Finish by stating why it benefits the developer or system."
    ],
    sampleAnswer: ${JSON.stringify(entry.a)},
    goodVocab: ["REST", "Endpoints", "OpenAPI", "JSON"]
  }`;
}

const file = 'd:/Echo Lab/src/data/interviewData.js';
let content = fs.readFileSync(file, 'utf8');

// replace the last } from the array
content = content.replace(/ \}\n\];/, ' }' + resultStr + '\n];');
fs.writeFileSync(file, content);
console.log('Appended ' + entries.length + ' API questions!');
