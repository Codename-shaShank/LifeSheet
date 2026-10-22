# Solutions

One JSON file per problem, named by the problem `id` from the generated sheet JSON
(e.g. `two-sum.json`). Files are lazy-loaded only when that problem's page opens.
Problems without a file show placeholders.

```json
{
  "statement": "Your own short summary of the problem.",
  "sections": [
    { "title": "Brute force", "body": "Two nested loops…" },
    { "title": "Optimal", "body": "Hashmap of value → index…" }
  ],
  "code": [
    { "lang": "cpp", "code": "class Solution { … };" }
  ]
}
```

Write statements in your own words rather than copying them from LeetCode.

FUTURE: the AI chat panel on the problem page will receive this file as context.
