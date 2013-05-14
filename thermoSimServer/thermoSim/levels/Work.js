
canvasHeight = 450;
$(function(){
	imgPath = 'work';
	animText = new AnimText(c);
	myCanvas.height = canvasHeight;
	renderer = new Renderer();
	window['curLevel'] = new Work();
	curLevel.cutSceneEnd();
	curLevel.init();
	addJQueryElems($('button'), 'button');
	$('#resetExp').click(function(){curLevel.reset()});
	$('#toSim').click(function(){nextPrompt()});
	$('#toLastStep').click(function(){prevPrompt()});
	$('#previous').click(function(){prevPrompt()});
	$('#next').click(function(){nextPrompt()});
});

myCanvas.width = $('#main').width();




function Work(){
	this.setStds();
	this.readouts = {};
	
	this.compMode = 'Isothermal';

	
	addSpecies(['spc1', 'spc3', 'spc4', 'spc5']);
	this.yMin = 30;
	this.yMax = 350;
}
_.extend(Work.prototype, 
			LevelTools, 
{
	init: function(){
		this.readout = new Readout('mainReadout', 30, myCanvas.width-155, 25, '13pt calibri', Col(255,255,255), 'left');
		$('#mainHeader').text('Work');
		showPrompt(0, 0, true);
	},	
	
	sections:[
		{//B0
			setup:
				function() {
					currentSetupType = 'section';
					new AuxPicture('img/work/block0Pic1.jpg');
					new AuxPicture('img/work/block0Pic2.jpg');
					
				},
			prompts:[
				{//P0
					setup:undefined,
					cutScene:true,
					text:"Today we�re going to investigate how work transfers energy to a system.  First we�re going to develop the equations that describe a process on an adiabatic system. </p><p>If we compress the adiabatic system pictured to the right at a constant external pressure from state 1 to state 2, which of the following equations best represents the work done?</p>",
					quiz:[
						{	
							type:'multChoice',
							options:
								[
								{text:"||EQ2||", isCorrect: false, message:"Which P should you be using?"},
								{text:"||EQ3||", isCorrect: false, message:"Yeah, but you won't do work with constant volume in this system."},
								{text:"||EQ1||", isCorrect: true},
								{text:"||EQ4||", isCorrect: false, message:"Do your units work out?"}
							]
						},
					]
				},
				{//P1
					setup:undefined,
					cutScene:true,
					text: "||EQ1BR<p>Indeed.  This equation tells us that work done on a system is equal to how hard you compress a container per area times how much you compress it.</p><p>Now from the first law, we know</p>||EQ5CE<p>For our adiabatic system, which of the following relations is correct, if we assume constant heat capacity?</p>",
					quiz:[
						{	
							type:'multChoice',
							options:
								[
								{text:"||EQ8||", isCorrect: false, message:"But it's adiabatic!"},
								{text:"||EQ6||", isCorrect: true},
								{text:"||EQ7||", isCorrect: false, message:"Why Cp?"},
								{text:"It cannot be simplified", isCorrect: false, message:"Yes it can.  What is Q equal to for an adiabatic system?"}
							]
						}
					],				
				}
			]
		},
		{//B1
			setup: 
				function() {
					currentSetupType = 'section';
					walls = WallHandler({pts:[[P(40,30), P(510,30), P(510,440), P(40,440)]], handlers:'staticAdiabatic', handles:['container']});
					walls[0].setHitMode('ArrowSpd');
					this.borderStd({min:30});
					this.compArrow = new CompArrow({mode:'adiabatic', speed:1.5});
					spcs['spc4'].populate(P(45,235), V(460, 100), 1, 600);
							
				},
			prompts:[//make comp arrow conditions be on prompt, not block
				{//P0
					setup:
						function() {
							currentSetupType = 'prompt0';
							this.tempListener = new StateListener({dataList:walls[0].data.t, is:'notEqualTo', targetVal:dataHandler.temp(), alertUnsatisfied:"Try hitting the molecule with the wall while the wall's moving"});	
						},
					text:"<center>||EQ6||</center>From the equation above we see that temperature increases as we do work by decreasing volume.  Temperature is an expression is molecular kinetic energy, so as the system is compressed, the molecules must speed up.  These ideal gas molecules can be thought of as perfectly elastic bouncy balls.  Using the movable wall above, can you determine what event causes the molecule's speed to change?  Can you explain why that would cause a temperature change in many molecules?",
					quiz:[
						{	
							type:'text',
							text:'Type your answer here',
						}
					],
				},
				{//P1
					setup:undefined,
					text:"<p>So the molecules speed up when they collide with the moving wall.  Those collisions add kinetic energy, which means that the temperature increases.</p><p>Now let's do an experiment where we compress our adiabatic system.",
				}
			]
		},
		{//B2
			setup:
				function() {
					currentSetupType = 'section';

					walls = WallHandler({pts:[[P(40,60), P(510,60), P(510,380), P(40,380)]], handlers:'staticAdiabatic', handles:['container'], vols:[15]});
					spcs['spc1'].populate(P(45,65), V(460, 300), 1000, 200);
					spcs['spc3'].populate(P(45,65), V(450, 300), 800, 200);
					
				
					this.graphs.pVSv = new GraphScatter({handle:'pVSv', xLabel:"Volume (L)", yLabel:"Pressure (bar)",
										axesInit:{x:{min:6, step:2}, y:{min:0, step:3}}});
					this.graphs.pVSv.addSet({address:'p', label:'P Ext.', pointCol:Col(50,50,255), flashCol:Col(200,200,255),
											data:{x:walls[0].data.v, y:walls[0].data.pExt}, trace:true});

					this.dragWeights = new DragWeights({weightDefs:[{count:1, mass:213.2}], weightScalar:8, displayText:false, massInit:0, compMode:'cPAdiabaticDamped', pistonOffset:V(130,-41)});
					this.piston = new Piston({wallInfo:'container', init:2, min:2, max:15, makeSlider:false});
					walls[0].displayPExt();
					this.borderStd({min:30});
					//this.clamps = new Clamps({clampee:this.dragWeights, clamps:[{vol:13}, {vol:10}]});
					//this.clamps.release()
				},
			prompts:[
				{//P0
					setup:
						function() {
							currentSetupType = 'prompt0';
							this.pListener = new StateListener({dataList:walls[0].data.pExt, is:'equalTo', targetVal:15, atSatisfyFunc: {func:function(){this.dragWeights.freeze()}, obj:this}});
							this.volListener10 = new StateListener({dataList:walls[0].data.v, is:'lessThan', targetVal:10, alertUnsatisfied:'Compress the system!', cleanUpWith:currentSetupType});						
						},
					text:"Above is a well insulated piston cylinder assembly.  Place the block on top of the piston and observe the response.  How much work did the piston and block do on the system?",
					quiz:[
						{	
							type:'textSmall',
							units:'kJ',
							text:'',
						}
					],	
				},
				{//P1
					setup:undefined,
					text:"The system had an initial temperature of 200 K and contains 1.8 moles of an ideal monatomic gas.  You wrote that GET_userAnswerB2P0Q0| kJ of work were done.  What final temperature should the system have had?",
					quiz:[
						{	
							type:'textSmall',
							units:'K',
							text:'',
						}
					],
				}
			]
		},
		{//B3
			setup:
				function() {
					currentSetupType = 'section';
					this.sections[2].setup.apply(this);
					walls[0].displayTemp();
					walls[0].displayWork();
					this.graphs.tVSv = new GraphScatter({handle:'tVSv', xLabel:"Volume (L)", yLabel:"Temperature (K)",
										axesInit:{x:{min:6, step:2}, y:{min:0, step:200}}});
					this.graphs.tVSv.addSet({address:'t', label:'T sys.', pointCol:Col(255,50,50), flashCol:Col(200,200,255),
											data:{x:walls[0].data.v, y:walls[0].data.t}});					
				},
			prompts:[
				{//P0
					setup:
						function() {
							currentSetupType = 'prompt0';
							this.sections[2].prompts[0].setup.apply(this);
						},
					text:"Previously you answered that the compression did GET_userAnswerB2P0Q0|kJ on the system bringing it to a final temperature of GET_userAnswerB2P1Q0|K.  Here's the same compression, but this time we're displaying work done and temperature. How do the results compare?  If there's a discrepency, can you account for it?",
					quiz:[
						{
							type:'text',
							text:"Type your answer here",
						}
					],
				},
				{//P1
					setup: undefined,
					cutScene:true,
					text:"||EQ6CEIf you'll notice, the T vs. V graph is linear.  Using the equation above, find what its slope should should be with 1.8 moles of an ideal monatomic gas.  Do the slopes from the equation and from the graph match?",
					quiz:[
						{
							type:'textSmall',
							label:'Slope from graph:',
							text:"",
						},
						{
							type:'textSmall',
							label:'Slope from equation:',
							text:"",
						},
						{
							type:'text',
							text:'',
							label:"<p>Given our P<sub>ext</sub>, should the graph be linear or did something go wrong?  Explain.</p>",
						}
					],
				},
				{//P2
					setup:undefined,
					cutScene:true,
					text:"<p>Now we'll look at expanding the same system of 1.8 moles with P<sub>ext</sub> of 2 bar from 7.5 L to 15 L.</p>  <p>How much work will the system do on its surroundings in this expansion, and what will its final temperature be?</p>",
					quiz:[
						{
							type:'textSmall',
							label:'Work done:',
							units:"kJ",
							text:"",
						},
						{
							type:'textSmall',
							label:'Final temperature:',
							units:"K",
							text:"",
						},					
					
					],
				},
				{//P3
					setup: 
						function() {
						currentSetupType = 'prompt3';
						this.dragWeights.unfreeze();
						walls[0].resetWork();
						this.stops = new Stops({stopPt:{volume:15}});
						this.volListener14 = new StateListener({dataList:walls[0].data.v, is:'greaterThan', targetVal:14, alertUnsatisfied:'Expand the system!', atSatisfyFunc: {func:function(){this.dragWeights.freeze()}, obj:this}});				
					},
					text: "You wrote that the system would do GET_userAnswerB3P2Q0| kJ of work for a final temperature of GET_userAnswerB3P2Q1| K.  Find out of you were right by expanding the system.  The system has undergone a two-step process.  First it was compressed by adding a block.  Then it was expanded to its original volume by removing the block.  Before the compression, the system's temperature was 200K.  After the expansion, the temperature was 650K GET ACTUAL #.  Why is the system temperature higher after going through this two-step process?",
					quiz:[
						{
							type:'text',
							text:"Type your answer here.",
						}
					]
				}
			]
		},
		{//B4
			setup:undefined,
			prompts:[
				{
					setup:undefined,
					cutScene:true,
					text:"<p>In the context of this system, the first law says</p> ||EQ6CE <p>and we saw that obeyed in the previous experiments.  Remember how work transfers energy through collisions between molecules and the moving wall?</p><p>Do you think that mechanism always produces the temperature change predicted by the first law?  Let's investigate what effect the number of molecules in the system has on the change in temperature.</p><p>Maybe add a response block here, but it seems like people have no basis on which to speculate here</p>",
				}
			],
		},
		{//B5
			setup: 
				function(){
					currentSetupType = 'block';
					walls = WallHandler({pts:[[P(40,60), P(510,60), P(510,380), P(40,380)]], handlers:'staticAdiabatic', handles:['container'], vols:[15]});
					this.stops = new Stops({stopPt:{volume:7}, draw:false});
					//spcs['spc3'].populate(P(45,65), V(450, 300), 800, 200);
					//this.dragWeights = new DragWeights({weightDefs:[{name:'lrg', count:1, mass:213.2}], weightScalar:8, displayText:false, massInit:0, compMode:'cPAdiabaticDamped', pistonOffset:V(130,-41)});
					this.piston = new Piston({wallInfo:'container', min:0, init:.01, max:15, makeSlider:false});
					walls[0].displayPExt(undefined, undefined, 2);
					walls[0].displayTemp();
					this.borderStd({min:30});
					
					
					
				},
			prompts:[
				{//P0
					setup:
						function(){
							currentSetupType = 'prompt0';
							dotManager.clearAll()
							walls[0].reset();
							this.clamps = new Clamps({clampee:this.piston, clamps:[{vol:7.5}]});
							spcs['spc1'].populate(P(45,65), V(460, 300), 1, 200);
							this.piston.setPressure(.01);
							this.listener1 = new StateListener({dataList:walls[0].data.v, is:'equalTo', targetVal:7.5, tolerance:.01, storeAtSatisfy:{temp:walls[0].data.t}, alertUnsatisfied:"Click the 'Release' button to compress the system"});	
						},
					text:"Okay, here's a system with one molecule.  Click the release button to let the piston fall.  The pressure has been scaled down so that if the first law is obeyed, the final temperature will be 701 K.  By the way, one molecule in this simulation corresponds to just under a billion trillion real molecules, so this isn't how a system with one molecule at this temperature and pressure would behave.",
					title:"Current step",
				},
				{//P1
					setup:
						function(){
							currentSetupType = 'prompt1';
							dotManager.clearAll()
							walls[0].reset();
							this.clamps = new Clamps({clampee:this.piston, clamps:[{vol:7.5}]});
							spcs['spc1'].populate(P(45,65), V(460, 300), 10, 200);
							this.piston.setPressure(.083);	
							this.listener1 = new StateListener({dataList:walls[0].data.v, is:'equalTo', targetVal:7.5, tolerance:.01, storeAtSatisfy:{temp:walls[0].data.t}, alertUnsatisfied:"Click the 'Release' button to compress the system"});								
						},
					text:"Now let's try 10 molecules.<br>Previous data:<p><table style='color:white;' border='1' bordercolor=white><tr><td># molecules</td><td>T<sub>f</sub><tr><td>1</td><td>GET_tempB5P0| K</td></tr><tr><td>Many</td><td>701 K</td></tr></table></p> ",
					title:"Current step",
				},
				{//P2
					setup:
						function(){
							currentSetupType = 'prompt2';
							dotManager.clearAll();
							walls[0].reset();
							this.clamps = new Clamps({clampee:this.piston, clamps:[{vol:7.5}]});
							spcs['spc1'].populate(P(45,65), V(460, 300), 50, 200);
							this.piston.setPressure(.41);
							this.listener1 = new StateListener({dataList:walls[0].data.v, is:'equalTo', targetVal:7.5, tolerance:.01, storeAtSatisfy:{temp:walls[0].data.t}, alertUnsatisfied:"Click the 'Release' button to compress the system"});	
						},
					text:"Here are 50 molecules.<br>Previous data:<p><table style='color:white;' border='1' bordercolor=white><tr><td># molecules</td><td>T<sub>f</sub><tr><td>1</td><td>GET_tempB5P0| K</td></tr><tr><td>10</td><td>GET_tempB5P1| K</td></tr><tr><td>Many</td><td>701 K</td></tr></table></p>",
					title:"Current step",
				},
				{//P3
					setup:
						function(){
							currentSetupType = 'prompt3';
							dotManager.clearAll();
							walls[0].reset();
							this.clamps = new Clamps({clampee:this.piston, clamps:[{vol:7.5}]});
							spcs['spc1'].populate(P(45,65), V(460, 300), 100, 200);
							this.piston.setPressure(.833);
							this.listener1 = new StateListener({dataList:walls[0].data.v, is:'equalTo', targetVal:7.5, tolerance:.01, storeAtSatisfy:{temp:walls[0].data.t}, alertUnsatisfied:"Click the 'Release' button to compress the system"});	
						},
					text:"And here are 100.<br>Previous data:<p><table style='color:white;' border='1' bordercolor=white><tr><td># molecules</td><td>T<sub>f</sub><tr><td>1</td><td>GET_tempB5P0| K</td></tr><tr><td>10</td><td>GET_tempB5P1| K</td></tr><tr><td>50</td><td>GET_tempB5P2| K</td></tr><tr><td>Many</td><td>701 K</td></tr></table></p> How does the piston's behavior change as the number of molecules increases?",
					title:"Current step",
					quiz:[
						{
							type:'text',
							text:"Type your answer here.",
						}
					]					
				
				},
				{//P4
					setup:undefined,
					text:"Here's all the collected data:<p><table style='color:white;' border='1' bordercolor=white><tr><td># molecules</td><td>T<sub>f</sub><tr><td>1</td><td>GET_tempB5P0| K</td></tr><tr><td>10</td><td>GET_tempB5P1| K</td></tr><tr><td>50</td><td>GET_tempB5P2| K</td></tr><tr><td>100</td><td>GET_tempB5P3| K</td></tr><tr><td>Many</td><td>701 K</td></tr></table></p>  Do you notice a trend?  If so, why might that trend exist?",
					title:"Current step",
					cutScene:true,
					quiz:[
						{
							type:'text',
							text:"Type your answer here.",
						}
					]
				},
				{//P5
					setup: undefined,
					text:"<p>Now you pick how many moles of gas to put in the system.  Try to pick so that the final temperature is closest the what the first law predicts (701 K)</p>.",
					title:"",
					cutScene:true,
					quiz:[
						{	
							type:'buttons',
							options:
								[
								{text:"0.25", isCorrect: true, func:function(){store('count', 250); store('pExt', 2.083)}},
								{text:"0.5", isCorrect: true, func:function(){store('count', 500); store('pExt', 4.167)}},
								{text:"0.75", isCorrect: true, func:function(){store('count', 750); store('pExt', 6.25)}},
								{text:"1.0", isCorrect: true, func:function(){store('count', 1000); store('pExt', 8.33)}}
							]
						},
					]
				},
				{//P6
					setup:
						function(){
							currentSetupType = 'prompt5';
							dotManager.clearAll();
							walls[0].reset();
							this.clamps = new Clamps({clampee:this.piston, clamps:[{vol:7.5}]});
							spcs['spc1'].populate(P(45,65), V(460, 300), getStore('count')/2, 200);
							spcs['spc1'].populate(P(45,65), V(460, 300), getStore('count')/2, 200);
							this.piston.setPressure(getStore('pExt'));
							this.listener1 = new StateListener({dataList:walls[0].data.v, is:'equalTo', targetVal:7.5, tolerance:.01, storeAtSatisfy:{temp:walls[0].data.t}, alertUnsatisfied:"Click the 'Release' button to compress the system"});	
						},
					text:"Previous data:<p><table style='color:white;' border='1' bordercolor=white><tr><td># molecules</td><td>T<sub>f</sub><tr><td>1</td><td>GET_tempB5P0| K</td></tr><tr><td>10</td><td>GET_tempB5P1| K</td></tr><tr><td>50</td><td>GET_tempB5P2| K</td></tr><tr><td>100</td><td>GET_tempB5P3| K</td></tr><tr><td>Many</td><td>701 K</td></tr></table></p>",
					title:"Current step",
				},
					
			]
			
		},
		{//B6
			setup:undefined,
			prompts:[
				{//P0
					setup:undefined,
					cutScene:true,
					text:"Previous data:<p><table style='color:white;' border='1' bordercolor=white><tr><td># molecules</td><td>T<sub>f</sub><tr><td>1</td><td>GET_tempB5P0| K</td></tr><tr><td>10</td><td>GET_tempB5P1| K</td></tr><tr><td>50</td><td>GET_tempB5P2| K</td></tr><tr><td>100</td><td>GET_tempB5P3| K</td></tr><tr><td>GET_count|</td><td>GET_tempB5P6| K</td></tr><tr><td>Many</td><td>701 K</td></tr></table></p><p>From the data, what conclusions can you draw about when the first law applies, and why?</p>Could add outro, but apart from that, this is the end.",
					quiz:[
						{
							type:'text',
							text:"Type your answer here.",
						}
					]	
				}
			]
		}
	]
}
	
)