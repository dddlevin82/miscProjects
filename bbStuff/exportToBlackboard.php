<?php

include_once 'configuration_settings.php';

include_once $libraries_dir . 'html_tools.php';

//look into HandleFileSelection in html tools

class ExportToBlackboard{
	
	//allow_url_fopen must be on
	public function ExportToBlackboard($questions, $maxQuestionScore, $save_test_asc_Id, $temp_dir){
		if(sizeof($questions[0]==0)){
			$questions = array_slice($questions, 1);		
		}
		$this->questions = $questions;
		$this->maxQuestionScore = $maxQuestionScore;
		$this->association_id = $save_test_asc_Id;
		
		
		$res00001Text = $this->buildRes00001();
		$res00002Text = $this->buildRes00002($testId);
		$res00003Text = $this->buildRes00003();
		$bbPackageSigText = '443A68BF4E8FAF1FA664719583230D71';
		$bbPackageInfoText = $this->getBbPackageInfoText();
		$imsManifestTest = $this->buildImsManifest($imgFiles);
		
		$file_tmp_dir = $temp_dir;// . "bbtmp/";
		
		$this->writeFile($res00001Text, 'res00001.dat', $file_tmp_dir);
		$this->writeFile($res00002Text, 'res00002.dat', $file_tmp_dir);
		$this->writeFile($res00003Text, 'res00003.dat', $file_tmp_dir);	
		$this->writeFile($bbPackageSigText, '.bb-package-sig', $file_tmp_dir);
		$this->writeFile($bbPackageInfoText, '.bb-package-info', $file_tmp_dir);
		$this->writeFile($imsManifestTest, 'imsmanifest.xml', $file_tmp_dir);
		$this->writeFile('filler', 'filler.txt', $file_tmp_dir);
		
		$files = array(
			array("fileName"=>"res00001.dat", "origFolder" => $file_tmp_dir, "destFolder"=>""), 
			array("fileName"=>"res00002.dat", "origFolder" => $file_tmp_dir, "destFolder"=>""), 
			array("fileName"=>"res00003.dat", "origFolder" => $file_tmp_dir, "destFolder"=>""), 
			array("fileName"=>".bb-package-sig", "origFolder" => $file_tmp_dir, "destFolder"=>""), 
			array("fileName"=>".bb-package-info", "origFolder" => $file_tmp_dir, "destFolder"=>""),
			array("fileName"=>"imsmanifest.xml", "origFolder" => $file_tmp_dir, "destFolder"=>""),
			array("fileName"=>"filler.txt", "origFolder" => $file_tmp_dir, "destFolder"=>"csfiles/home_dir/")
		);
		$this->filename_zip = $this->zip($files, $file_tmp_dir);
	}

	function buildImsManifest($imgFiles){
		$imsmanifest = "<?xml version='1.0' encoding='UTF-8'?>\n<manifest identifier='man00001' "."\n";
		$imsmanifest .= "xmlns:bb='http://www.blackboard.com/content-packaging/'><organizations/><resources><resource bb:file='res00001.dat' "."\n";
		$imsmanifest .= "bb:title='trying images' identifier='res00001' type='assessment/x-bb-qti-test' xml:base='res00001'>"."\n";
		$imsmanifest .= "</resource><resource bb:file='res00002.dat' "."\n";
		$imsmanifest .= "bb:title='Assessment Creation Settings' identifier='res00002' type='course/x-bb-courseassessmentcreationsettings' "."\n";
		$imsmanifest .= "xml:base='res00002'/><resource bb:file='res00003.dat' bb:title='Shared Objects Repository' identifier='res00003' "."\n";
		$imsmanifest .= "type='resource/x-bb-lor' xml:base='res00003'/></resources></manifest> "."\n";	
		return $imsmanifest;	
	}
	function buildRes00001(){
		$header = $this->build1Header();
		$body = $this->build1Body();	
		$footer = "\n</section></assessment></questestinterop>";
		$toReturn = $header.$body.$footer;	
		return $toReturn;
	}
	function build1Header(){
		$numQuestions = count($this->questions);
		$header = '<?xml version="1.0" encoding="UTF-8"?>'."\n";
		$header .= '<questestinterop><assessment '."\n";
		$header .= 'title="Exported CW questions"><assessmentmetadata><bbmd_asi_object_id>Concept Warehouse test</bbmd_asi_object_id><bbmd_asitype>Assessment</bbmd_asitype><bbmd_assessmenttype>Test</bbmd_assessmenttype><bbmd_sectiontype>Subsection</bbmd_sectiontype><bbmd_questiontype>Multiple Choice</bbmd_questiontype><bbmd_is_from_cartridge>false</bbmd_is_from_cartridge><bbmd_is_disabled>false</bbmd_is_disabled><bbmd_numbertype>none</bbmd_numbertype><bbmd_partialcredit/><bbmd_orientationtype>vertical</bbmd_orientationtype><bbmd_is_extracredit>false</bbmd_is_extracredit>'."\n";
		$header .= '<qmd_absolutescore_max>' . $numQuestions*$this->maxQuestionScore . '</qmd_absolutescore_max><qmd_weighting>0.0</qmd_weighting><qmd_instructornotes/></assessmentmetadata><rubric '."\n";
		$header .= 'view="All"><flow_mat class="Block"><material><mat_extension><mat_formattedtext '."\n";
		$header .= 'type="HTML"></mat_formattedtext></mat_extension></material></flow_mat></rubric><presentation_material><flow_mat '."\n";
		$header .= 'class="Block"><material><mat_extension><mat_formattedtext '."\n";
		$header .= 'type="HTML">Multiple choice questions from OSU Concept Warehouse</mat_formattedtext></mat_extension></material></flow_mat></presentation_material><section><sectionmetadata><bbmd_asi_object_id>_12151316_1</bbmd_asi_object_id><bbmd_asitype>Section</bbmd_asitype><bbmd_assessmenttype>Test</bbmd_assessmenttype><bbmd_sectiontype>Subsection</bbmd_sectiontype><bbmd_questiontype>Multiple Choice</bbmd_questiontype><bbmd_is_from_cartridge>false</bbmd_is_from_cartridge><bbmd_is_disabled>false</bbmd_is_disabled><bbmd_numbertype>none</bbmd_numbertype><bbmd_partialcredit/><bbmd_orientationtype>vertical</bbmd_orientationtype><bbmd_is_extracredit>false</bbmd_is_extracredit><qmd_absolutescore_max>1.0</qmd_absolutescore_max><qmd_weighting>0.0</qmd_weighting><qmd_instructornotes/></sectionmetadata> '."\n";		
		return $header;
	}
	function build1Body(){
		$body = '';
		foreach($this->questions as $question){
			$body .= $this->buildQuestion($question);
		}			
		return $body;
	}
	function buildQuestion($question){
		$text = '';
		$text .= $this->buildPrompt($question);
		$choiceText = '<flow class="RESPONSE_BLOCK"><response_lid ident="response" rcardinality="Single" rtiming="No"><render_choice maxnumber="0" minnumber="0" shuffle="No">'."\n";
		$reprocHeader = $this->buildReprocHeader();
		$reprocTextCorrect = '';
		$reprocBody = '';
		$reprocTextIncorrect = $this->buildReprocIncorrect();
		$feedbackText = '';
		$feedbackTextCorrect = $this->buildFeedbackCorrect();
		$feedbackTextIncorrect = $this->buildFeedbackIncorrect();
		$itemfeedBack = '';
		$qIds = array();
		$choiceIdx = 0;
		foreach($question["elements"]["answers_and_comments"] as $choice){
			$newId =  'IDNET' . $choiceIdx;
			array_push($qIds, $newId);
			$choiceText .= $this->buildChoiceFlow($choice, $newId, $question);	
			if($choice["is_correct"]){
				$reprocTextCorrect .= $this->buildReprocCorrect($newId);
			}
			$reprocBody .= $this->buildReproc($choice, $newId);
			$feedbackText .= $this->buildFeedback($newId);
			$choiceIdx++;
		}
		$choiceText .= '</render_choice></response_lid></flow></flow></presentation>'."\n";
		$reprocFooter = '</resprocessing>'."\n";
		$text .= $choiceText;
		$text .= $reprocHeader . $reprocTextCorrect . $reprocTextIncorrect . $reprocBody . $reprocFooter;
		$text .= $feedbackTextCorrect . $feedbackTextIncorrect. $feedbackText;
		$text .= '</item>'."\n";
		return $text;
	}
	function buildPrompt($question){
		$html_tool = new DynamicPageMaker();
		$questionIdx = array_search($question, $this->questions);
		if($question["elements"]["main_picture"]){
			$imgHTML = '&lt;br&gt;&lt;img src="'.$html_tool->GetPictureUrl($question["elements"]["main_picture"]).'"&gt;&lt;/img&gt;';
		} else {
			$imgHTML = '';	
		}
		$prompt = '<item '."\n";
		$prompt .='maxattempts="0" '."\n";
		$prompt .= 'title="'.$question["elements"]["title"].'"><itemmetadata><bbmd_asi_object_id>ITEM'.$questionIdx.'</bbmd_asi_object_id><bbmd_asitype>Item</bbmd_asitype><bbmd_assessmenttype>Test</bbmd_assessmenttype><bbmd_sectiontype>Subsection</bbmd_sectiontype> '."\n";
		$prompt .= '<bbmd_questiontype>Multiple Choice</bbmd_questiontype><bbmd_is_from_cartridge>false</bbmd_is_from_cartridge><bbmd_is_disabled>false</bbmd_is_disabled><bbmd_numbertype>none</bbmd_numbertype><bbmd_partialcredit>false</bbmd_partialcredit><bbmd_orientationtype>vertical</bbmd_orientationtype><bbmd_is_extracredit>false</bbmd_is_extracredit> '."\n";
		$prompt .= '<qmd_absolutescore_max>1.0</qmd_absolutescore_max><qmd_weighting>0.0</qmd_weighting><qmd_instructornotes/></itemmetadata><presentation><flow '."\n";
		$prompt .= 'class="Block"><flow class="QUESTION_BLOCK">'."\n";
		
		$prompt .= '<flow '."\n";
		$prompt .= 'class="FORMATTED_TEXT_BLOCK"><material><mat_extension><mat_formattedtext '."\n";
		if ($questionIdx==0) {
			$prompt .= 'type="HTML">'.$this->buildJS().$this->toValidXML($question["elements"]["text_options"]["1"]["text"]).$imgHTML.'</mat_formattedtext></mat_extension></material></flow>'."\n";
		} else {
			$prompt .= 'type="HTML">'.$this->toValidXML($question["elements"]["text_options"]["1"]["text"]).$imgHTML.'</mat_formattedtext></mat_extension></material></flow>'."\n";
		}
		$prompt .= '</flow>	'."\n";
		return $prompt;
	}
	function buildChoiceFlow($choice, $Id, $question){
		$html_tool = new DynamicPageMaker();
		if($choice["picture_id"]){//if there is answer picture
			$imgHTML = '&lt;br&gt;&lt;img src="'.$html_tool->GetPictureUrl($choice["picture_id"]).'"&gt;&lt;/img&gt;\n';
		} else {
			$imgHTML = '';	
		}
		$text = '<flow_label class="Block"><response_label '."\n";
		$text .= 'ident="'.$Id.'" rarea="Ellipse" rrange="Exact" shuffle="Yes"><flow_mat '."\n";
		$text .= 'class="FORMATTED_TEXT_BLOCK"><material><mat_extension><mat_formattedtext '."\n";
		$text .= 'type="HTML">'.$this->toValidXML($choice["text"]).$imgHTML.$this->addIdentifierDiv($question, $choice).'</mat_formattedtext></mat_extension></material></flow_mat> '."\n";

		$text .= '</response_label></flow_label> '."\n";
		return $text;
	}
	function addIdentifierDiv($question, $choice) {
		return $this->toValidXML('<div name="questionIdCW" style="visibility:hidden;">'.$question["elements"]["question_id"].'</div><div name="answerIdCW" style="visibility:hidden;">'.$choice["question_answer_id"].'</div>');
	}
	function buildReprocHeader(){
		$text = '';
		$text .= '<resprocessing '."\n";
		$text .= 'scoremodel="SumOfScores"><outcomes><decvar defaultval="0.0" maxvalue="' .$this->maxQuestionScore. '" minvalue="0.0" varname="SCORE" '."\n";
		$text .= 'vartype="Decimal"/></outcomes> '."\n";
		return $text;
	}
	function buildReprocCorrect($Id){
		$text = '';
		$text .= '<respcondition title="correct"><conditionvar><varequal case="No" '."\n";
		$text .= 'respident="response">' .$Id. '</varequal></conditionvar><setvar action="Set" '."\n";
		$text .= 'variablename="SCORE">SCORE.max</setvar><displayfeedback feedbacktype="Response" '."\n";
		$text .= 'linkrefid="correct"/></respcondition>';
		return $text;
	}
	function buildReprocIncorrect($questions){
		$text = '';
		$text .= '<respcondition title="incorrect"><conditionvar><other/></conditionvar><setvar '."\n";
		$text .= 'action="Set" variablename="SCORE">0.0</setvar><displayfeedback feedbacktype="Response" '."\n";
		$text .= 'linkrefid="incorrect"/></respcondition> '."\n";
		return $text;		
	}
	function buildReproc($choice, $Id){
		$pts = $this->maxScore * $choice->IS_CORRECT;
		$reprocText =  '<respcondition><conditionvar><varequal case="No" '."\n";
		$reprocText .= 'respident="'.$Id.'"/></conditionvar><setvar action="Set" '."\n";
		$reprocText .= 'variablename="SCORE">' .$pts. '</setvar><displayfeedback feedbacktype="Response" '."\n";
		$reprocText .= 'linkrefid="' .$Id. '"/></respcondition>'."\n";
		return $reprocText;
	}
	function buildFeedbackCorrect(){
		$text = '';
		$text .= '<itemfeedback ident="correct" '."\n";
		$text .= 'view="All"><flow_mat class="Block"><flow_mat '."\n";
		$text .= 'class="FORMATTED_TEXT_BLOCK"><material><mat_extension><mat_formattedtext '."\n";
		$text .= 'type="HTML"/></mat_extension></material></flow_mat></flow_mat></itemfeedback>'."\n";
		return $text;
	}
	function buildFeedbackIncorrect(){
		$text = '';
		$text .= '<itemfeedback ident="incorrect" '."\n";
		$text .= 'view="All"><flow_mat class="Block"><flow_mat '."\n";
		$text .= 'class="FORMATTED_TEXT_BLOCK"><material><mat_extension><mat_formattedtext '."\n";
		$text .= 'type="HTML"/></mat_extension></material></flow_mat></flow_mat></itemfeedback>'."\n";
		return $text;		
	}
	function buildFeedback($Id){
		$text = '';
		$text .= '<itemfeedback '."\n";
		$text .= 'ident="' .$Id. '" view="All"><solution feedbackstyle="Complete" '."\n";
		$text .= 'view="All"><solutionmaterial><flow_mat class="Block"><flow_mat '."\n";
		$text .= 'class="FORMATTED_TEXT_BLOCK"><material><mat_extension><mat_formattedtext '."\n";
		$text .= 'type="HTML"/></mat_extension></material></flow_mat></flow_mat></solutionmaterial></solution></itemfeedback>'."\n";
		return $text;
	}
	function buildRes00002($testId){
		$text = '';
		$text .='<?xml version="1.0" encoding="UTF-8"?>'."\n";
		$text .='<ASSESSMENTCREATIONSETTINGS><ASSESSMENTCREATIONSETTING id="_123735_1"><QTIASSESSMENTID value="' .$testId. '"/><ANSWERFEEDBACKENABLED>false</ANSWERFEEDBACKENABLED><QUESTIONATTACHMENTSENABLED>true</QUESTIONATTACHMENTSENABLED><ANSWERATTACHMENTSENABLED>true</ANSWERATTACHMENTSENABLED><QUESTIONMETADATAENABLED>true</QUESTIONMETADATAENABLED><DEFAULTPOINTVALUEENABLED>true</DEFAULTPOINTVALUEENABLED><DEFAULTPOINTVALUE>10.0</DEFAULTPOINTVALUE><ANSWERPARTIALCREDITENABLED>true</ANSWERPARTIALCREDITENABLED><ANSWERRANDOMORDERENABLED>true</ANSWERRANDOMORDERENABLED><ANSWERORIENTATIONENABLED>true</ANSWERORIENTATIONENABLED><ANSWERNUMBEROPTIONSENABLED>true</ANSWERNUMBEROPTIONSENABLED><USEPOINTSFROMSOURCEBYDEFAULT>true</USEPOINTSFROMSOURCEBYDEFAULT></ASSESSMENTCREATIONSETTING></ASSESSMENTCREATIONSETTINGS>	'."\n";
		return $text;
	}
	function buildRes00003(){
		return '<?xml version="1.0" encoding="UTF-8"?><loSubscriptions/>';
	}
	function getBbPackageInfoText(){
		return "#Bb PackageInfo Property File\n
			#Fri Aug 10 14:49:02 PDT 2012\n
			java.class.path=/usr/local/blackboard/apps/service-wrapper/lib/wrapper.jar\:/usr/local/java/lib/tools.jar\:/usr/local/blackboard/apps/tomcat/bin/bootstrap.jar\:/usr/local/blackboard/apps/tomcat/lib/bb-tomcat-bootstrap.jar\:/usr/local/blackboard/apps/tomcat/lib/log4j.jar\n
			cx.config.course.id=CH_122_400_W2012\n
			java.vendor=Sun Microsystems Inc.\n
			os.name=SunOS\n
			os.arch=sparcv9\n
			java.home=/usr/local/jdk1.6.0_29/jre\n
			db.product.name=Oracle\n
			cx.package.info.version=6.0\n
			os.version=5.10\n
			cx.config.full.value=CxConfig{operation\=EXPORT, courseid\=CH_122_400_W2012, package\=/usr/local/blackboard/content/vi/bb_bb60/sessions/5/8/9/3/5/8/3/4/session/Test_ExportFile_CH_122_400_W2012_trying images.zip, logger\=CxLogger{logs\=[Log{name\=/usr/local/blackboard/content/vi/bb_bb60/sessions/5/8/9/3/5/8/3/4/session/Test_ExportFile_CH_122_400_W2012_trying images.log, verbosity\=default}, Log{name\=STDOUT, verbosity\=default}], logHooks\=[]}, resource_type_inclusions\=[resource/x-bb-lor], area_inclusions\=[ALIGNMENTS], area_exclusions\=[ALL], object_inclusions\={ASSESSMENT\=[_12151315_1]}, object_exclusions\={}, features\={CreateOrg\=false, Bb5LinkToBrokenImageFix\=true, ArchiveUserPasswords\=false}, strHostName\=null, isCommandLineRequest\=false, isCourseConversion\=false, eventHandlers\=[]}\n
			cx.config.package.name=/usr/local/blackboard/content/vi/bb_bb60/sessions/5/8/9/3/5/8/3/4/session/Test_ExportFile_CH_122_400_W2012_trying images.zip\n 
			db.product.version=Oracle Database 10g Release 10.2.0.4.0 - 64bit Production\n
			db.driver.name=Oracle JDBC driver\n
			cx.config.operation=blackboard.apps.cx.CxConfig".'$Operation'."\:EXPORT\n
			java.version=1.6.0_29\n
			cx.config.package.identifier=41ae306fac8d4ec99285c38a2ff019ca\n
			db.driver.version=11.1.0.7.0-Production\n
			java.default.locale=en_US\n
			app.release.number=9.1.50119.0\n
			cx.config.logs=[Log{name\=/usr/local/blackboard/content/vi/bb_bb60/sessions/5/8/9/3/5/8/3/4/session/Test_ExportFile_CH_122_400_W2012_trying images.log, verbosity\=default}, Log{name\=STDOUT, verbosity\=default}]\n
			";
		//HEY LOOK AT THE Test_ExportFile - CHANGE.  IS CH_122.  CHANGE?  TO WHAT?
	}
	function writeFile($text, $name, $dir){
		if($dir!=undefined){
			$name = $dir.$name;	
		}
		$file = fopen($name, 'w') or die("can't open file:" . $name);
		fwrite($file, $text);
		fclose($file);
		return $file;
	}
	function zip($fileData, $directory = ""){
		$zip = new ZipArchive();
		
		$tmp_filename = $directory . rand(0,99999) . 'test.zip';
		
		if($zip->open($tmp_filename, ZIPARCHIVE::CREATE)!==true){
			exit("Cannot open <$tmp_filename>\n");	
			
		}
		foreach($fileData as $fileDatum){
			$zip->addFile($fileDatum["origFolder"].$fileDatum["fileName"], $fileDatum["destFolder"].$fileDatum["fileName"]);		
		} 
		$zip->close();
		
		return $tmp_filename;
		
	}
	function buildJS() {
		$js = '<script>';
		$js .= $this->getJSQuestionInfo();
		$js .= '
			function SendToCW() {
				this.testId = ' . $this->association_id . ';
				this.getStudentName();
				this.addBBMatchups();
				this.reassignSubmits();
			};
			SendToCW.prototype = {
				getStudentName: function() {
					this.name = parent.frames[0].document.getElementById("loggedInUserName").innerHTML;
				},
				addBBMatchups: function() {
					var questionIdDivs = document.getElementsByName("questionIdCW");
					for (var divIdx=0; questionIdDivs.length>divIdx; divIdx++) {
						var questionIdDiv = questionIdDivs[divIdx];
						var questionId = questionIdDiv.innerHTML;
						var parent = questionIdDiv.parentElement;
						var answerIdDiv = undefined;
						for (var childIdx=0; parent.children.length>childIdx;childIdx++) {
							if (parent.children[childIdx].getAttribute("name") == "answerIdCW") {
								answerIdDiv = parent.children[childIdx];
								break;
							}
						};
						var answerId = answerIdDiv.innerHTML;
						var BBanswerId = questionIdDiv.parentElement.getAttribute("for");	
						matchupData[questionId][answerId] = BBanswerId;
					};
				},  
				reassignSubmits: function() {       
					var submitButtons = this.grabSubmitButtons();      
					for (var buttonIdx=0; buttonIdx<submitButtons.length; buttonIdx++) {
						this.reassignSubmit(submitButtons[buttonIdx]);
					};
				},      
				reassignSubmit: function(button) {       
					var self = this;
					var oldFunc = button.onclick;
					var newFunc = function() {
						self.funcToAppend();
						oldFunc();
						for (var windowIdx=0; windowIdx<self.windows.length; windowIdx++) {
							self.windows[windowIdx].close();
						}						
					};
					button.onclick = newFunc;
				},      
				grabSubmitButtons: function() {       
					var topButton = document.getElementsByName("top_Save and Submit")[0];       
					var bottomButton = document.getElementsByName("bottom_Save and Submit")[0];       
					return [bottomButton, topButton];          
				},
				funcToAppend: function() 
					for (var questionId in matchupData) {
						var question = matchupData[questionId];
						for (var answerId in question) {
							var BBId = question[answerId];
							if (document.getElementById(BBId).checked) {
								this.sendAnswer(questionId, answerId);
							};
						};
					};		
				},
				sendAnswer: function(questionId, answerId) {
					var nameHash = hex_md5(this.name);
					var URL = "http://www.jimi.cbee.oregonstate.edu/concept_warehouse/bill_test/CW.php?goto=clicker&command=send_answer_mc&receiver="+ ' . $_SESSION["faculty_id"] . '+"&saved_test_association_id="+this.testId+"&clicker_type=blackboard&question_id="+questionId+"&clicker_id=" + nameHash + "&question_answer_ids="+answerId;
					this.windows.push(window.open(URL));
				},

			};  
	
			window.onload = function() {      
				var sendToCW = new SendToCW();      
			};
			
		';
		$js .= $this->hashFunc();
		$js .= '</script>';
		
		return $this->toValidXML($js);	
	}
	function hashFunc() {
		return '

			var hexcase = 0;  
			var b64pad  = "";


			function hex_md5(s)    { return rstr2hex(rstr_md5(str2rstr_utf8(s))); }
			function b64_md5(s)    { return rstr2b64(rstr_md5(str2rstr_utf8(s))); }
			function any_md5(s, e) { return rstr2any(rstr_md5(str2rstr_utf8(s)), e); }
			function hex_hmac_md5(k, d)
			  { return rstr2hex(rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d))); }
			function b64_hmac_md5(k, d)
			  { return rstr2b64(rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d))); }
			function any_hmac_md5(k, d, e)
			  { return rstr2any(rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d)), e); }

			function md5_vm_test()
			{
			  return hex_md5("abc").toLowerCase() == "900150983cd24fb0d6963f7d28e17f72";
			}


			function rstr_md5(s)
			{
			  return binl2rstr(binl_md5(rstr2binl(s), s.length * 8));
			}


			function rstr_hmac_md5(key, data)
			{
			  var bkey = rstr2binl(key);
			  if(bkey.length > 16) bkey = binl_md5(bkey, key.length * 8);

			  var ipad = Array(16), opad = Array(16);
			  for(var i = 0; i < 16; i++)
			  {
				ipad[i] = bkey[i] ^ 0x36363636;
				opad[i] = bkey[i] ^ 0x5C5C5C5C;
			  }

			  var hash = binl_md5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
			  return binl2rstr(binl_md5(opad.concat(hash), 512 + 128));
			}


			function rstr2hex(input)
			{
			  try { hexcase } catch(e) { hexcase=0; }
			  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
			  var output = "";
			  var x;
			  for(var i = 0; i < input.length; i++)
			  {
				x = input.charCodeAt(i);
				output += hex_tab.charAt((x >>> 4) & 0x0F)
					   +  hex_tab.charAt( x        & 0x0F);
			  }
			  return output;
			}


			function rstr2b64(input)
			{
			  try { b64pad } catch(e) { b64pad=''; }
			  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
			  var output = "";
			  var len = input.length;
			  for(var i = 0; i < len; i += 3)
			  {
				var triplet = (input.charCodeAt(i) << 16)
							| (i + 1 < len ? input.charCodeAt(i+1) << 8 : 0)
							| (i + 2 < len ? input.charCodeAt(i+2)      : 0);
				for(var j = 0; j < 4; j++)
				{
				  if(i * 8 + j * 6 > input.length * 8) output += b64pad;
				  else output += tab.charAt((triplet >>> 6*(3-j)) & 0x3F);
				}
			  }
			  return output;
			}

			/*
			 * Convert a raw string to an arbitrary string encoding
			 */
			function rstr2any(input, encoding)
			{
			  var divisor = encoding.length;
			  var i, j, q, x, quotient;

			  /* Convert to an array of 16-bit big-endian values, forming the dividend */
			  var dividend = Array(Math.ceil(input.length / 2));
			  for(i = 0; i < dividend.length; i++)
			  {
				dividend[i] = (input.charCodeAt(i * 2) << 8) | input.charCodeAt(i * 2 + 1);
			  }

			  /*
			   * Repeatedly perform a long division. The binary array forms the dividend,
			   * the length of the encoding is the divisor. Once computed, the quotient
			   * forms the dividend for the next step. All remainders are stored for later
			   * use.
			   */
			  var full_length = Math.ceil(input.length * 8 /
												(Math.log(encoding.length) / Math.log(2)));
			  var remainders = Array(full_length);
			  for(j = 0; j < full_length; j++)
			  {
				quotient = Array();
				x = 0;
				for(i = 0; i < dividend.length; i++)
				{
				  x = (x << 16) + dividend[i];
				  q = Math.floor(x / divisor);
				  x -= q * divisor;
				  if(quotient.length > 0 || q > 0)
					quotient[quotient.length] = q;
				}
				remainders[j] = x;
				dividend = quotient;
			  }

			  /* Convert the remainders to the output string */
			  var output = "";
			  for(i = remainders.length - 1; i >= 0; i--)
				output += encoding.charAt(remainders[i]);

			  return output;
			}

			/*
			 * Encode a string as utf-8.
			 * For efficiency, this assumes the input is valid utf-16.
			 */
			function str2rstr_utf8(input)
			{
			  var output = "";
			  var i = -1;
			  var x, y;

			  while(++i < input.length)
			  {
				/* Decode utf-16 surrogate pairs */
				x = input.charCodeAt(i);
				y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
				if(0xD800 <= x && x <= 0xDBFF && 0xDC00 <= y && y <= 0xDFFF)
				{
				  x = 0x10000 + ((x & 0x03FF) << 10) + (y & 0x03FF);
				  i++;
				}

				/* Encode output as utf-8 */
				if(x <= 0x7F)
				  output += String.fromCharCode(x);
				else if(x <= 0x7FF)
				  output += String.fromCharCode(0xC0 | ((x >>> 6 ) & 0x1F),
												0x80 | ( x         & 0x3F));
				else if(x <= 0xFFFF)
				  output += String.fromCharCode(0xE0 | ((x >>> 12) & 0x0F),
												0x80 | ((x >>> 6 ) & 0x3F),
												0x80 | ( x         & 0x3F));
				else if(x <= 0x1FFFFF)
				  output += String.fromCharCode(0xF0 | ((x >>> 18) & 0x07),
												0x80 | ((x >>> 12) & 0x3F),
												0x80 | ((x >>> 6 ) & 0x3F),
												0x80 | ( x         & 0x3F));
			  }
			  return output;
			}

			/*
			 * Encode a string as utf-16
			 */
			function str2rstr_utf16le(input)
			{
			  var output = "";
			  for(var i = 0; i < input.length; i++)
				output += String.fromCharCode( input.charCodeAt(i)        & 0xFF,
											  (input.charCodeAt(i) >>> 8) & 0xFF);
			  return output;
			}

			function str2rstr_utf16be(input)
			{
			  var output = "";
			  for(var i = 0; i < input.length; i++)
				output += String.fromCharCode((input.charCodeAt(i) >>> 8) & 0xFF,
											   input.charCodeAt(i)        & 0xFF);
			  return output;
			}

			/*
			 * Convert a raw string to an array of little-endian words
			 * Characters >255 have their high-byte silently ignored.
			 */
			function rstr2binl(input)
			{
			  var output = Array(input.length >> 2);
			  for(var i = 0; i < output.length; i++)
				output[i] = 0;
			  for(var i = 0; i < input.length * 8; i += 8)
				output[i>>5] |= (input.charCodeAt(i / 8) & 0xFF) << (i%32);
			  return output;
			}

			/*
			 * Convert an array of little-endian words to a string
			 */
			function binl2rstr(input)
			{
			  var output = "";
			  for(var i = 0; i < input.length * 32; i += 8)
				output += String.fromCharCode((input[i>>5] >>> (i % 32)) & 0xFF);
			  return output;
			}

			/*
			 * Calculate the MD5 of an array of little-endian words, and a bit length.
			 */
			function binl_md5(x, len)
			{
			  /* append padding */
			  x[len >> 5] |= 0x80 << ((len) % 32);
			  x[(((len + 64) >>> 9) << 4) + 14] = len;

			  var a =  1732584193;
			  var b = -271733879;
			  var c = -1732584194;
			  var d =  271733878;

			  for(var i = 0; i < x.length; i += 16)
			  {
				var olda = a;
				var oldb = b;
				var oldc = c;
				var oldd = d;

				a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
				d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
				c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
				b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
				a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
				d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
				c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
				b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
				a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
				d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
				c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
				b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
				a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
				d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
				c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
				b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

				a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
				d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
				c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
				b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
				a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
				d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
				c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
				b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
				a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
				d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
				c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
				b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
				a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
				d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
				c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
				b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

				a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
				d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
				c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
				b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
				a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
				d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
				c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
				b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
				a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
				d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
				c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
				b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
				a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
				d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
				c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
				b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

				a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
				d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
				c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
				b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
				a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
				d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
				c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
				b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
				a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
				d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
				c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
				b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
				a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
				d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
				c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
				b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

				a = safe_add(a, olda);
				b = safe_add(b, oldb);
				c = safe_add(c, oldc);
				d = safe_add(d, oldd);
			  }
			  return Array(a, b, c, d);
			}

			/*
			 * These functions implement the four basic operations the algorithm uses.
			 */
			function md5_cmn(q, a, b, x, s, t)
			{
			  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
			}
			function md5_ff(a, b, c, d, x, s, t)
			{
			  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
			}
			function md5_gg(a, b, c, d, x, s, t)
			{
			  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
			}
			function md5_hh(a, b, c, d, x, s, t)
			{
			  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
			}
			function md5_ii(a, b, c, d, x, s, t)
			{
			  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
			}

			/*
			 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
			 * to work around bugs in some JS interpreters.
			 */
			function safe_add(x, y)
			{
			  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
			  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
			  return (msw << 16) | (lsw & 0xFFFF);
			}

			/*
			 * Bitwise rotate a 32-bit number to the left.
			 */
			function bit_rol(num, cnt)
			{
			  return (num << cnt) | (num >>> (32 - cnt));
			}	
		';
	}
	function getJSQuestionInfo() {
		//making object of objects, like 
		//need name, questionId, 
		$js = 'var matchupData = {};';
		foreach ($this->questions as $question) {
			$js.='var newQuestion = {};
			';	
			foreach ($question["elements"]["answers_and_comments"] as $choice) {
				$js .= '
					newQuestion['.$choice["question_answer_id"].'] = undefined;';						
			}		
			$js .='		
			matchupData['.$question["elements"]["question_id"].'] = newQuestion;
			';		

			
			
		}
		return $js;	
	}
	function toValidXML($str) {
		return str_replace('%', '&#37;', str_replace('>', '&gt;', str_replace('<', '&lt;', str_replace('&', '&amp;',$str))));	 
	}
	
	function OutputFile(){
		
		header("Pragma: no-cache");
		header("Expires: 0");
		header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
		header("Content-Type: application/force-download");
		header("Content-Type: application/octet-stream");
		header("Content-Type: application/download");;
		header("Content-Disposition: attachment;filename="."CWBBQuestions.zip");
		header("Content-Length: " . filesize($this->filename_zip));
		ob_clean();
		flush();
		readfile($this->filename_zip);
		unlink($this->filename_zip);
		
	}
}

?>