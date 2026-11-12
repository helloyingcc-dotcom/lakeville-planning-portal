const MODEL=(()=>{
const tabs=[['start','Start here'],['events','Current events'],['workflow','Workflow & roles'],['features','Feature priorities'],['questions','Questions & accounting'],['ahead','Looking ahead'],['preview','App preview'],['pro','Pro tier planning']];
// Sections only the portal owner (OWNER_EMAILS) can see or change.
const OWNER_SECTIONS=['preview','pro'];
// Tier names and prices: change them here only.
const TIERS={base:{name:'School-Year Essentials',price:'$249 per school year',blurb:'Everything in the plan Lakeville is subscribing to.'},pro:{name:'School-Year Pro',price:'Upgrade pricing to come',blurb:'Optional extras. Tell us what interests you; nothing here is built yet.'}};
// [key, title, description, tier]  base = included in the subscription, pro = higher tier (not built yet)
const features=[
['signupform','Direct sign-up in the app','No more Google Forms: families sign up on the event’s own page and get their QR ticket right away. Each event adds its own questions.','base'],
['import','Spreadsheet import','Have families in an Excel or CSV list already (paper sign-ups, last year’s list)? Bring them in; nobody gets a duplicate ticket.','base'],
['checkin','QR code check-in','Quick check-in for students, parents and guests.','base'],
['attendees','Attendee management','See registration details, search by name or QR code, and spot no-shows.','base'],
['payment','Payment tracking','Record Zelle, cash and check payments and mark them verified.','base'],
['reports','Live dashboard & reports','Real-time attendance, payment status and event metrics; export to Excel/CSV.','base'],
['events','Unlimited events','Family nights, socials and fundraisers all school year. The app stays on over the summer and breaks too, so you can plan and set up next year’s events.','base'],
['access','Volunteer access','Multiple volunteer accounts with permissions you control.','base'],
['reminders','Automated emails','Confirmations, reminders and event details sent for you.','base'],
['tickettypes','Adult & kid tickets','Set one price per family, or separate adult and kid prices. See adult and kid totals for sign-ups, check-in and reports.','base'],
['cancel','Families can change or cancel','Families remove someone who can’t come (4 → 3 attending) or cancel the whole ticket. The PTA is notified, the head count updates, and any Zelle/cash refund is recorded.','base'],
['volunteers','Volunteer sign-up slots','List the helpers each event needs (e.g. ticket table 5–6 pm); volunteers sign up, get a reminder and are checked in at the event. Email them anytime.','base'],
['groups','Grade & teacher groups','Students are tagged by grade and teacher when families sign up, so you can filter, email and report by grade or class.','base'],
['items','Items & answers report','See who ordered extras like pizza, how many, and how every sign-up question was answered.','base'],
['calendar','Events calendar','All upcoming events on one page; families add them to their phone calendar.','base'],
['announce','Email registered families','Send a quick update to everyone signed up for an event: parking, weather, what to bring.','base'],
['vip','VIP guests','Mark special guests like the superintendent as VIPs with a free ticket; volunteers get a “please greet” alert when they arrive.','base'],
['mobile','Phone-friendly','Easy to use on a phone, especially at the check-in table.','base'],
['vendors','Vendor & expense tracking','Track vendors, quotes, purchases and receipts for each event.','pro'],
['budget','Event budgets & profit','Compare money in and money out for every event.','pro'],
['reimburse','Volunteer reimbursements','Volunteers submit receipts; treasurer approves repayment.','pro'],
['onlinepay','Online card payments','Families pay event fees by card inside the app.','pro'],
['capacity','Capacity & waitlists','Limit spaces and manage a waiting list automatically.','pro'],
['refunds','Cancellations & refunds','Handle cancellation requests and refund follow-up.','pro'],
['tasks','PTA task assignments','Assign and track preparation tasks before each event.','pro'],
['selfcheckin','Family self check-in','A door QR sign for each event: families scan it with their phone when they arrive and check themselves in, so fewer volunteers are needed at the door.','pro'],
['runofshow','Run of show','A minute-by-minute schedule for event night: who does what and when (doors open, raffle, announcements, cleanup), shared with volunteers on their phones.','pro'],
['seating','Assigned seating','Give VIPs or families a row and seat number (e.g. Row C, Seat 219), shown on their ticket and at check-in.','pro'],
['reuse','Copy a past event','Start a new event from last year’s details.','pro'],
['accounting','Accounting connection','Send event money in and out to your bookkeeping system.','pro']];
// "Looking ahead": Lakeville-facing questions about possible future upgrades (the Pro list, minus anything offered in Essentials).
// [feature id, question, hint]. Never name the tier or a price here.
const AHEAD=[
['onlinepay','Would families ever pay by credit or debit card in the app?','Today your plan tracks Zelle, cash, check and envelope payments. Card payments would go straight to the PTA’s own account, with a small card fee per payment.'],
['vendors','Do you need a place to track vendors and event expenses?','For example food trucks, a DJ, rentals or supplies: quotes, purchases and receipts for each event.'],
['budget','Would you like to plan a budget for each event?','Set a budget, then see money in vs. money out and what each event raised.'],
['reimburse','Should volunteers submit receipts for reimbursement in the app?','Volunteers upload a receipt and the treasurer approves repayment.'],
['capacity','Do any events need a spot limit or a waiting list?','For example a dance with limited space, or game sessions that fill up.'],
['refunds','Would you refund card payments in the app?','Cancelling is already in your plan. This is about sending money back automatically for families who paid by card.'],
['selfcheckin','Would families check themselves in at the door with their phone?','A QR sign by the entrance on event day: families scan it and check in on their own, so fewer volunteers are needed at the check-in table. Volunteer check-in is already in your plan.'],
['runofshow','Would a run of show help on event night?','A minute-by-minute schedule of who does what and when (doors open 5:30, raffle 6:15, announcements, cleanup), that volunteers can see on their phones.'],
['seating','Do any events need assigned seats?','For example a reserved seat for the superintendent (Row C, Seat 219), or numbered seats for a show. VIP guests with a free ticket and a greeting alert are already in your plan.'],
['tasks','Would you assign prep tasks to PTA members before each event?','For example “order pizza” or “print signs”, with due dates.'],
['reuse','Would you start next year’s event from last year’s details?','Copy an event’s settings, questions and volunteer jobs.'],
['accounting','Should event money in and out go to your bookkeeping system?','For example QuickBooks or a treasurer’s spreadsheet.']];
const INTEREST=['Yes, we’d use this','Maybe later','Not needed','Not sure'];
// What Lakeville gets in School-Year Essentials (shown on the Start page). Keep in step with the Scope sheet.
const INCLUDED=[
['Sign-ups',['Families sign up directly in the app: no more Google Forms. Every event gets its own sign-up page with your own questions (pizza count, T-shirt size…)','Have a list in Excel already (paper sign-ups, last year’s families)? Import it; nobody gets a duplicate ticket','One registration per family: parents, students and guests together','Separate adult and kid prices (e.g. adults $5, kids free) or one price per family']],
['Digital tickets',['One QR ticket per family, emailed the moment they sign up','Edit and re-send tickets for last-minute changes','An updated ✅ ticket once their payment is confirmed','Plans change? Families can remove someone who can’t come, or cancel the whole registration, right from their ticket; the PTA is notified and the head count updates']],
['Payment tracking',['Track Zelle, cash, check and envelope payments','Verified / Pending / Not paid for every family','Automatic reminders to families who haven’t paid']],
['Event night check-in',['4 or more volunteers checking in at once, each on their own phone','Scan the QR code or search by parent name, student name or ticket code','Check in part of a family as they arrive, plus walk-ins at the door','Paid / Not paid shown at the door, with a ✅ screen once a family is checked in','VIP guests (like the superintendent) get a free ticket, and volunteers get a “please greet” alert when they arrive']],
['Volunteers',['Volunteer slots for each event, with reminders the day before','Email your volunteers, add helpers by hand, check them in on the night','Volunteer accounts with permissions you control']],
['Communication',['Automatic confirmations and reminders','Email everyone registered for an event, or just one grade','See how many emails were delivered and opened','An events calendar families can add to their phone']],
['Reports',['Live dashboard: registered, checked in, attendance rate, payments, with adult and kid totals','Pre-event review of who’s registered, paid, pending or missing details','No-shows list after each event','Filter families by grade or teacher/class','See who ordered extras (like pizza) and how each question was answered','Reports by grade and teacher, with Excel/CSV export']],
['Everything else',['Unlimited events all school year, and the app stays on over the summer and school breaks so you can plan and set up ahead','Works on any phone, tablet or computer','A “Get started” checklist, plus setup, training, email support and updates from DBY']]];
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
ahead:[...AHEAD.flatMap(([id,q,hint])=>[{key:id+'Interest',label:q,hint,options:INTEREST},f(id+'AheadNotes','Notes','Optional: how you’d use it, or how you handle it today.')]),f('aheadOther','Anything else you might want one day?','Ideas you’ve had, or things other schools do that you like.')],
preview:[f('works','What already fits Lakeville in this draft?'),f('changes','What to change next, based on their answers'),f('missing','What their answers say is still missing')],
workflow:[f('event','Which event are you describing?','Pick one of the events from Current events.'),...steps.map((s,i)=>f('step'+i,s,'Describe Lakeville today and how you would improve this step.')),f('exceptions','What happens when something changes?','Full event, cancellation, failed payment, walk-in or missing volunteer.'),f('lead','PTA lead / event organizer','Who plans events? Can they publish or do they need approval?'),f('admin','App administrator','Who manages access, approvals and officer handover?'),f('volunteer','Volunteer','What may they see or change? Who may check families in?'),f('parent','Parent / guardian','What should they manage for their own family?'),f('sensitive','Information and permissions','Who may see family details, export lists and approve refunds?')],
questions:[f('firstVersion','Which features in your plan matter most for your first event?'),f('volume','How many events and families should we plan for?'),f('platform','How should people access it?','Mobile-friendly website, app-store download or not sure?'),f('registration','How do registrations work?','By family or individual child? Are guests and walk-ins allowed?'),f('communication','How do you communicate with families today?'),f('timing','Is there a target event or launch date?'),f('decision','Who will review the concept and approve the scope?'),f('success','What would make the first event a success?'),f('accountingTools','What do you use for bookkeeping and payments today?'),{key:'accountingNeed',label:'What does “accounting together” mean?',options:['Show event totals','Sync payments, fees and refunds','Manage full PTA bookkeeping','Not Sure']},f('pricingCore','What accounting functions in DBY’s existing system would be useful?','Describe what already exists or mark Not Sure. Integration is not connected in this portal.'),f('financialOwner','Who reconciles payments and approves refunds?'),f('financialData','What should flow between the systems?','For example event reference, transaction reference, amount, fee, refund and payout status.'),f('retention','What information must be kept, and for how long?'),f('open','Other questions or ideas')]
};
return {INCLUDED,AHEAD,INTEREST,MAX_EVENTS,EVENT_FIELDS,EVENT_ORDER,tabs,features,steps,sections,PRIORITY,SIGNAL,TIERS,OWNER_SECTIONS,INTRO_KEY:'intro'};
})();
