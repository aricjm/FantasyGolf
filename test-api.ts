async function run() {
  const nflRes = await fetch('https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/3117251'); // McCaffrey
  const nflData = await nflRes.json();
  if (nflData.injuries && nflData.injuries.$ref) {
    const injRes = await fetch(nflData.injuries.$ref);
    const injData = await injRes.json();
    console.log('NFL Injury data:', JSON.stringify(injData, null, 2));
  } else {
    console.log('No injuries ref found for NFL player.');
  }
}
run();
