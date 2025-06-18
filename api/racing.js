export default async function handler(req, res) {
  try {
    const sessionToken = process.env.BETFAIR_SESSION_TOKEN || 'DY8lZT9MzxC4dhEk9EiSMo4Edb3ap0lvQaK6WL2iCLA=';
    const appKey = process.env.BETFAIR_APP_KEY || 'nzIFcwyWhrlwYMrh';
    
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      'X-Application': appKey,
      'X-Authentication': sessionToken,
      'Accept-Language': 'en-AU,en;q=0.9',
      'Origin': 'https://www.betfair.com.au',
      'Referer': 'https://www.betfair.com.au/exchange/plus/horse-racing'
    };

    const apiUrl = `https://apieds.betfair.com.au/api/eds/meeting-races/v4?ak=${appKey}&countriesGroup=[[2]]&eventTypeGroup=[[1,4161]]&hasEventOwnedTeams=false&meetingStatus=ACTIVE,NEXT_TO_GO&resultsStatus=&isRaceActive=true&format=json`;
    
    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      throw new Error(`Betfair API returned ${response.status}`);
    }

    const data = await response.json();
    
    const races = data.results?.slice(0, 12).map(meeting => {
      return meeting.races?.map(race => ({
        id: race.id,
        trackId: meeting.id,
        raceNumber: race.raceNumber,
        name: race.raceName || `Race ${race.raceNumber}`,
        distance: race.distance || 1200,
        grade: race.raceClass || "Class 1",
        trackCondition: race.trackCondition || "Good",
        startTime: new Date(race.raceStartTime),
        status: race.raceStatus || "upcoming",
        type: race.raceType === "4161" ? "greyhound" : "horse",
        track: {
          id: meeting.id,
          name: meeting.meetingName,
          location: meeting.venueName || meeting.meetingName,
          state: meeting.countryCode === "AU" ? "AUS" : meeting.countryCode,
          type: race.raceType === "4161" ? "greyhound" : "horse"
        },
        runners: race.runners?.slice(0, 10).map((runner, index) => ({
          id: runner.runnerId || index,
          raceId: race.id,
          number: runner.runnerNumber || index + 1,
          name: runner.runnerName || `Runner ${index + 1}`,
          jockeyTrainer: runner.jockeyName ? `${runner.jockeyName}` : "TBA",
          barrier: runner.barrier || index + 1,
          weight: runner.weight || null,
          form: runner.form || "-----",
          odds: [{
            id: 1,
            runnerId: runner.runnerId || index,
            bookmaker: "Betfair",
            winOdds: (runner.lastPriceTraded || 5.0).toFixed(2),
            placeOdds: ((runner.lastPriceTraded || 5.0) * 0.4).toFixed(2),
            updatedAt: new Date()
          }]
        })) || []
      }));
    }).flat().filter(Boolean) || [];

    res.status(200).json(races);
  } catch (error) {
    console.error('Betfair API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch racing data',
      message: error.message
    });
  }
}
