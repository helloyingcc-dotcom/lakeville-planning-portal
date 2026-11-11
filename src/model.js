const MODEL=(()=>{
const tabs=[['start','Start here'],['events','Current events'],['workflow','Workflow & roles'],['features','Feature priorities'],['questions','Questions & accounting'],['preview','App preview'],['pro','Pro tier planning']];
// Sections only the portal owner (OWNER_EMAILS) can see or change.
const OWNER_SECTIONS=['preview','pro'];
// Tier names and prices: change them here only.
const TIERS={base:{name:'School-Year Essentials',price:'$249 per school year',blurb:'Everything in the plan Lakeville is subscribing to.'},pro:{name:'School-Year Pro',price:'Upgrade pricing to come',blurb:'Optional extras. Tell us what interests you; nothing here is built yet.'}};
// [key, title, description, tier]  base = included in the subscription, pro = higher tier (not built yet)
const features=[
['import','Registration import','Bring in sign-ups from Google Forms or a CSV file.','base'],
['checkin','QR code check-in','Quick check-in for students, parents and guests.','base'],
['attendees','Attendee management','See registration details, search by name or QR code, and spot no-shows.','base'],
['payment','Payment tracking','Record Zelle, cash and check payments and mark them verified.','base'],
['reports','Live dashboard & reports','Real-time attendance, payment status and event metrics; export to Excel/CSV.','base'],
['events','Unlimited events','Family nights, socials and fundraisers, September to June.','base'],
['access','Volunteer access','Multiple volunteer accounts with permissions you control.','base'],
['reminders','Automated emails','Confirmations, reminders and event details sent for you.','base'],
['mobile','Phone-friendly','Easy to use on a phone, especially at the check-in table.','base'],
['vendors','Vendor & expense tracking','Track vendors, quotes, purchases and receipts for each event.','pro'],
['budget','Event budgets & profit','Compare money in and money out for every event.','pro'],
['reimburse','Volunteer reimbursements','Volunteers submit receipts; treasurer approves repayment.','pro'],
['onlinepay','Online card payments','Families pay event fees by card inside the app.','pro'],
['signupform','Built-in registration forms','Families register directly in the app, no Google Forms needed.','pro'],
['shifts','Volunteer shift sign-ups','Volunteers pick jobs and time slots themselves.','pro'],
['capacity','Capacity & waitlists','Limit spaces and manage a waiting list automatically.','pro'],
['refunds','Cancellations & refunds','Handle cancellation requests and refund follow-up.','pro'],
['tasks','PTA task assignments','Assign and track preparation tasks before each event.','pro'],
['reuse','Copy a past event','Start a new event from last year’s details.','pro'],
['accounting','Accounting connection','Send event money in and out to your bookkeeping system.','pro']];
const MAX_EVENTS=10, EVENT_FIELDS=6;
const EVENT_ORDER=['Model this one first','Next','Later'];
const PRIORITY=['Must Have','Nice to Have','Not Sure'];
const SIGNAL=['Strong signal','Some signal','No signal yet'];
const f=(key,label,hint)=>({key,label,hint});
const steps=['Plan the event','Review and publish','Invite families','Register and pay if needed','Fill volunteer shifts','Prepare and remind','Run the event and check in','Close, report and reuse'];
const sections={
start:[f('completedBy','Who is contributing?','Names or PTA roles are enough.'),f('goal','What is the main improvement you want?')],
events:[...Array.from({length:MAX_EVENTS},(_,i)=>[f(`event${i}Name`,`Event ${i+1} · Event name`),f(`event${i}Team`,`Event ${i+1} · Who runs it?`,'Team lead or contact for this event.'),f(`event${i}Process`,`Event ${i+1} · How do you run it today?`,'Sign-ups, payments, tickets, check-in and communication.'),f(`event${i}Pain`,`Event ${i+1} · What is the hardest part?`),f(`event${i}Better`,`Event ${i+1} · What would make it easier?`),{key:`event${i}Order`,label:`Event ${i+1} · When should we look at it?`,options:EVENT_ORDER}]).flat(),f('tools','Tools Lakeville actually uses','Include what each tool does and whether you want to keep it.'),f('moreEvents','Anything else about your events?')],
features:[...features.filter(x=>x[3]==='base').flatMap(([id,name])=>[{key:id+'Priority',label:name+' (priority)',options:PRIORITY},f(id+'Notes',name+' notes')]),f('additional','Anything else you would like?','Tell us about anything else you need. We’ll review requests outside your plan separately.')],
pro:[...features.filter(x=>x[3]==='pro').flatMap(([id,name])=>[{key:id+'Signal',label:name+' (signal)',options:SIGNAL},f(id+'Evidence',name+': evidence from Lakeville','Quote or summarise what they asked for, and where (section, question or comment).')]),f('newIdeas','New Pro ideas from Lakeville’s answers','Anything they asked for that isn’t in the plan or the list above.'),f('proPrice','Draft Pro price'),f('proNotes','Notes')],
preview:[f('works','What already fits Lakeville in this draft?'),f('changes','What to change next, based on their answers'),f('missing','What their answers say is still missing')],
workflow:[f('event','Which event are you describing?','Pick one of the events from Current events.'),...steps.map((s,i)=>f('step'+i,s,'Describe Lakeville today and how you would improve this step.')),f('exceptions','What happens when something changes?','Full event, cancellation, failed payment, walk-in or missing volunteer.'),f('lead','PTA lead / event organizer','Who plans events? Can they publish or do they need approval?'),f('admin','App administrator','Who manages access, approvals and officer handover?'),f('volunteer','Volunteer','What may they see or change? Who may check families in?'),f('parent','Parent / guardian','What should they manage for their own family?'),f('sensitive','Information and permissions','Who may see family details, export lists and approve refunds?')],
questions:[f('firstVersion','Which features in your plan matter most for your first event?'),f('volume','How many events and families should we plan for?'),f('platform','How should people access it?','Mobile-friendly website, app-store download or not sure?'),f('registration','How do registrations work?','By family or individual child? Are guests and walk-ins allowed?'),f('communication','How do you communicate with families today?'),f('timing','Is there a target event or launch date?'),f('decision','Who will review the concept and approve the scope?'),f('success','What would make the first event a success?'),f('accountingTools','What do you use for bookkeeping and payments today?'),{key:'accountingNeed',label:'What does “accounting together” mean?',options:['Show event totals','Sync payments, fees and refunds','Manage full PTA bookkeeping','Not Sure']},f('pricingCore','What accounting functions in DBY’s existing system would be useful?','Describe what already exists or mark Not Sure. Integration is not connected in this portal.'),f('financialOwner','Who reconciles payments and approves refunds?'),f('financialData','What should flow between the systems?','For example event reference, transaction reference, amount, fee, refund and payout status.'),f('retention','What information must be kept, and for how long?'),f('open','Other questions or ideas')]
};
return {MAX_EVENTS,EVENT_FIELDS,EVENT_ORDER,tabs,features,steps,sections,PRIORITY,SIGNAL,TIERS,OWNER_SECTIONS,INTRO_KEY:'intro'};
})();
