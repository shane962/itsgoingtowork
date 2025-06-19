export default async function handler(req, res) {
  try {
    const data = await fetchBetfairData();
    const races = await processValidBetfairData(data);
    
    // Return array directly to match frontend expectations
    res.status(200).json(races);
  } catch (error) {
    console.error('Racing API Error:', error.message);
    // Return error object structure that frontend can handle
    res.status(500).json({ 
      error: 'Failed to fetch racing data',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
