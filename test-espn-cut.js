async function test() {
  const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard?dates=2024');
  const data = await res.json();
  const event = data.events.find(e => e.name.includes('Sony Open'));
  if (!event) return console.log('No Sony Open found');
  
  const comp = event.competitions[0];
  console.log('Event:', event.name);
  
  const cutGolfer = comp.competitors.find(c => c.linescores?.length < 4);
  console.log('Cut Golfer:', JSON.stringify(cutGolfer, null, 2));
  
  const madeCutGolfer = comp.competitors[0];
  console.log('Winner Linescores length:', madeCutGolfer?.linescores?.length);
  console.log('Winner linescores periods:', madeCutGolfer?.linescores?.map(ls => ls.period));
}
test();
