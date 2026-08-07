/**
 * Benign payloads for security testing.
 * These are used to verify that the frontend and backend validate, sanitise, and handle malicious
 * inputs gracefully without crashing the app, exposing database stack traces, or executing scripting events.
 */
export const SECURITY_PAYLOADS = {
  // Safe XSS payloads (no malicious execution)
  xss: [
    '<script>console.log("xss_test_safe")</script>',
    '<img src=x onerror=console.log("img_onerror_test_safe")>',
    'javascript:console.log("xss_js_scheme_test")',
    '<svg onload=console.log("svg_onload_test_safe")>'
  ],

  // SQL Injection character structures to see if database queries break
  sqli: [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT null, null --",
    "admin' --"
  ],

  // Boundary inputs (overflow and long inputs)
  overflow: [
    'A'.repeat(5000), // Exceeded length boundary
    '99999999999999999999999', // Extreme numeric levels
    '-99999', // Negative boundary level check
    '0', // Zero boundary
    '17', // Exceeded level boundary (1-16 valid)
    'NaN', // Type mismatch input
    'null', // Null string payload
    '\u0000', // Null byte payload
    '💩'.repeat(100), // Unicode emojis stress-test
    '卡牌数据' // Multibyte Unicode text
  ]
};
