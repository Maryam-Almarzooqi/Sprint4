
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors=require('cors');

const app = express();
const port = process.env.PORT || 8080; // Use the environment port if available (for Azure)

const API_BASE_URL = "https://healthriskcalculator-gbguhtfzcubde5b5.uaenorth-01.azurewebsites.net"; // Azure API base URL

app.use(cors());
// Middleware to parse JSON request body
app.use(bodyParser.json());

// Serve static files from the 'public' directory (if applicable)
app.use(express.static(path.join(__dirname, 'public')));

// API route to calculate risk based on user inputs
app.post('/calculate-risk', (req, res) => {
    let { age, weight, height, bloodPressure, familyHistory, units } = req.body;

    // Validate inputs
    if (!age || !weight || !height || !bloodPressure || !familyHistory || !units) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Convert weight and height if units are US
    if (units === 'us') {
        weight = weight * 2.20462; // kg to lbs
        height = height * 0.393701; // cm to inches
    }

    // BMI Calculation (using metric units)
    const heightInMeters = height / 100; // Convert cm to meters for BMI calculation
    const bmi = weight / (heightInMeters * heightInMeters);
    let bmiCategory = 'normal';
    if (bmi >= 25 && bmi < 30) {
        bmiCategory = 'overweight';
    } else if (bmi >= 30) {
        bmiCategory = 'obese';
    }

    // Age-based points
    let agePoints = 0;
    if (age < 30) {
        agePoints = 0;
    } else if (age < 45) {
        agePoints = 10;
    } else if (age < 60) {
        agePoints = 20;
    } else {
        agePoints = 30;
    }

    // Blood Pressure-based points
    let bpPoints = 0;
    switch (bloodPressure) {
        case 'normal':
            bpPoints = 0;
            break;
        case 'elevated':
            bpPoints = 15;
            break;
        case 'stage1':
            bpPoints = 30;
            break;
        case 'stage2':
            bpPoints = 75;
            break;
        case 'crisis':
            bpPoints = 100;
            break;
    }

    // Family History-based points
    let familyHistoryPoints = 0;
    if (familyHistory && familyHistory.length > 0 && familyHistory[0] !== "none") {
        familyHistoryPoints = 10 * familyHistory.length;
    }

    // Calculate total risk score
    const totalRiskScore = agePoints + (bmiCategory === 'normal' ? 0 : (bmiCategory === 'overweight' ? 30 : 75)) + bpPoints + familyHistoryPoints;

    // Determine risk category
    let riskCategory = 'low risk';
    if (totalRiskScore <= 50) {
        riskCategory = 'moderate risk';
    } else if (totalRiskScore <= 75) {
        riskCategory = 'high risk';
    } else {
        riskCategory = 'uninsurable';
    }

    // Send response with all necessary data
    res.json({
        bmiCategory,
        bpCategory: bloodPressure,
        riskScore: totalRiskScore,
        riskCategory
    });
});

// Catch-all for any undefined GET requests (optional)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index2.html')); // Serve your HTML file (adjust the path if needed)
});

// Start server
app.listen(port, () => {
    console.log(`Server is running at https://localhost:${port}`); // Local server for development
});
