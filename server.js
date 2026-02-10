const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const EMAIL = "rohan2274.be23@chitkara.edu.in";
const ALLOWED_KEYS = ["fibonacci", "prime", "lcm", "hcf", "AI"];
const MAX_FIBONACCI = 1000; // prevent event-loop blocking

app.get("/health", (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: EMAIL,
  });
});

function getFibonacci(n) {
  if (n === 0) return [];
  if (n === 1) return [0];
  const arr = [0, 1];
  for (let i = 2; i < n; i++) {
    arr.push(arr[i - 1] + arr[i - 2]);
  }
  return arr;
}

function isPrime(num) {
  if (num < 2) return false;
  for (let i = 2; i * i <= num; i++) {
    if (num % i === 0) return false;
  }
  return true;
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

function lcmTwo(a, b) {
  return (Math.abs(a) * Math.abs(b)) / gcd(a, b);
}

function validateIntegerArray(value) {
  if (!Array.isArray(value)) {
    return "Value must be an array";
  }
  if (value.length < 2) {
    return "Array must contain at least 2 elements";
  }
  for (let i = 0; i < value.length; i++) {
    if (typeof value[i] !== "number" || !Number.isInteger(value[i])) {
      return `Element at index ${i} is not an integer`;
    }
  }
  return null; 
}

function validatePositiveIntegerArray(value) {
  const err = validateIntegerArray(value);
  if (err) return err;
  for (let i = 0; i < value.length; i++) {
    if (value[i] <= 0) {
      return `Element at index ${i} must be a positive integer`;
    }
  }
  return null;
}

app.post("/bfhl", async (req, res) => {
  try {
    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({
        is_success: false,
        official_email: EMAIL,
        error: "Request body must be a JSON object",
      });
    }

    const keys = Object.keys(body);

    if (keys.length !== 1) {
      return res.status(400).json({
        is_success: false,
        official_email: EMAIL,
        error: "Request body must contain exactly one key",
      });
    }

    const key = keys[0];
    const value = body[key];

    if (!ALLOWED_KEYS.includes(key)) {
      return res.status(400).json({
        is_success: false,
        official_email: EMAIL,
        error: `Invalid key '${key}'. Allowed keys: ${ALLOWED_KEYS.join(", ")}`,
      });
    }

    if (key === "fibonacci") {
      if (typeof value !== "number" || !Number.isInteger(value)) {
        return res.status(400).json({
          is_success: false,
          official_email: EMAIL,
          error: "fibonacci value must be an integer",
        });
      }
      if (value < 0) {
        return res.status(400).json({
          is_success: false,
          official_email: EMAIL,
          error: "fibonacci value must be non-negative",
        });
      }
      if (value > MAX_FIBONACCI) {
        return res.status(400).json({
          is_success: false,
          official_email: EMAIL,
          error: `fibonacci value must not exceed ${MAX_FIBONACCI}`,
        });
      }

      return res.status(200).json({
        is_success: true,
        official_email: EMAIL,
        data: getFibonacci(value),
      });
    }

    if (key === "prime") {
      if (!Array.isArray(value)) {
        return res.status(400).json({
          is_success: false,
          official_email: EMAIL,
          error: "prime value must be an array of integers",
        });
      }
      if (value.length === 0) {
        return res.status(400).json({
          is_success: false,
          official_email: EMAIL,
          error: "prime array must not be empty",
        });
      }
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] !== "number" || !Number.isInteger(value[i])) {
          return res.status(400).json({
            is_success: false,
            official_email: EMAIL,
            error: `prime array element at index ${i} is not an integer`,
          });
        }
      }

      return res.status(200).json({
        is_success: true,
        official_email: EMAIL,
        data: value.filter(isPrime),
      });
    }

    if (key === "hcf") {
      const err = validatePositiveIntegerArray(value);
      if (err) {
        return res.status(400).json({
          is_success: false,
          official_email: EMAIL,
          error: err,
        });
      }

      const result = value.reduce((a, b) => gcd(a, b));
      return res.status(200).json({
        is_success: true,
        official_email: EMAIL,
        data: result,
      });
    }

    if (key === "lcm") {
      const err = validatePositiveIntegerArray(value);
      if (err) {
        return res.status(400).json({
          is_success: false,
          official_email: EMAIL,
          error: err,
        });
      }

      const result = value.reduce((a, b) => lcmTwo(a, b));
      return res.status(200).json({
        is_success: true,
        official_email: EMAIL,
        data: result,
      });
    }

    if (key === "AI") {
      if (typeof value !== "string" || value.trim().length === 0) {
        return res.status(400).json({
          is_success: false,
          official_email: EMAIL,
          error: "AI value must be a non-empty string",
        });
      }

      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_KEY}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: `Answer the following question in EXACTLY ONE WORD. No explanations, no punctuation, just one single word.\n\nQuestion: ${value.trim()}`,
                  },
                ],
              },
            ],
          },
          { timeout: 10000 }
        );

        const candidates = response?.data?.candidates;
        if (
          !candidates ||
          !candidates.length ||
          !candidates[0]?.content?.parts?.length
        ) {
          return res.status(500).json({
            is_success: false,
            official_email: EMAIL,
            error: "AI returned an empty or blocked response",
          });
        }

        const rawText = candidates[0].content.parts[0].text || "";
        const oneWord = rawText
          .trim()
          .split(/[\s\n]+/)[0]
          .replace(/[^a-zA-Z0-9]/g, "");

        if (!oneWord) {
          return res.status(500).json({
            is_success: false,
            official_email: EMAIL,
            error: "AI did not return a valid word",
          });
        }

        return res.status(200).json({
          is_success: true,
          official_email: EMAIL,
          data: oneWord,
        });
      } catch (aiErr) {

        return res.status(500).json({
          is_success: false,
          official_email: EMAIL,
          error: "AI service is currently unavailable",
        });
      }
    }
  } catch (err) {
 
    return res.status(500).json({
      is_success: false,
      official_email: EMAIL,
      error: "Internal server error",
    });
  }
});


app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      is_success: false,
      official_email: EMAIL,
      error: "Malformed JSON in request body",
    });
  }
  return res.status(500).json({
    is_success: false,
    official_email: EMAIL,
    error: "Internal server error",
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
