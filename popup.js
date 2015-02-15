/*** Opens supplied url in new tab***/
function openURL(newUrl) {
	chrome.tabs.create({url:newUrl.toString()});
}

/*** Retrieves search results from Library Genesis ***/
/*** Calls parseResp()                             ***/
function getSearchResults(urlStr, searchStr, searchType, resultsPage, prevTimeout) {
	/* set style of and display "searching..." */
	var refDiv = document.getElementById("refDiv");
	refDiv.align = "center";
	refDiv.style.color = "#D7F0F7";
	refDiv.style.fontSize = "20px";
	refDiv.style.fontWeight = "bold";
		
	var arrows   = document.getElementById("arrowDiv");
	var prvPgArr = document.getElementById("prevPageArrow");
	var nxtPgArr = document.getElementById("nextPageArrow");
	arrows.style.visibility = "hidden";
	arrows.style.position   = "absolute";
	prvPgArr.style.visibility = "hidden";
	nxtPgArr.style.visibility = "hidden";
	
	/* Request search results */
	var xhr = new XMLHttpRequest();
	
	if(prevTimeout == true) {
		xhr.timeout = 7500;
		urlStr = urlStr.replace("http://gen.lib.rus.ec/search.php?req=", "http://libgen.org/search.php?req=");
		urlStr = urlStr.replace("&open=0&view=simple&column=", "&open=0&view=simple&phrase=1&column=");
		refDiv.innerHTML = "Failed to connect to gen.lib.rus.ec. <br /> Trying libgen.org...";
	}
	else {
		xhr.timeout = 7500;
		if(resultsPage == 1)
			refDiv.innerHTML = "<br />Searching...";
		else 
			refDiv.innerHTML = "<br />Getting Page...";
	}
	
	xhr.open("GET",  urlStr, true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4) {
			//call the beast
			parseResp(xhr.responseText, searchStr, searchType, resultsPage);
		}
	}
	/* On timeout */
	xhr.ontimeout = function() {
		if(prevTimeout == false) {
			prevTimeout = true;
			getSearchResults(urlStr, searchStr, searchType, resultsPage, prevTimeout)
		}
		else {
			refDiv.innerHTML = "Error: Failed to retrieve results. Please try again later.";
		}
	}
	xhr.send();
}

/*** 1. Resets form to initial state ***/
/*** 2. Places users previous search ***/
/***    query in search box          ***/
function resetExt(userSearchString) {
	var searchDiv = document.getElementById("searchDiv");
	
	/* Clear search results */ 
	document.getElementById("refDiv").innerHTML = "";
	document.getElementById("refDiv2").innerHTML = "";
	
	/* Place previous search string in search input form */
	var searchTextBox = document.getElementById("searchText");
	searchTextBox.value=userSearchString;
	searchTextBox.select();
	
	/* Hide back arrow */
	var backArrow = document.getElementById("backArrow");
	backArrow.style.visibility="hidden";
	
	/* Make search div visible - holds search forms */
	searchDiv.style.display="inline";
	
	/* Hide prev/next page arrows */
	var arrows   = document.getElementById("arrowDiv");
	var prvPgArr = document.getElementById("prevPageArrow");
	var nxtPgArr = document.getElementById("nextPageArrow");
	arrows.style.visibility = "hidden";
	arrows.style.position   = "absolute";
	prvPgArr.style.visibility = "hidden";
	nxtPgArr.style.visibility = "hidden";
}

//the beast
/*** Handles response from Library Genesis ***/
/***  and displays results.                ***/
/*** Args: resp - html data from lib gen   ***/
/***	   currPageNum - page number of    ***/
/***	   results						   ***/
function parseResp(resp,searchStr, searchType,currPageNum) {
	/* Create two div elements to hold resp data */
    var data = document.createElement("div"); 
	var data2 = document.createElement("div");
	
	/* Place html response from Library Genesis in 'data' */
	data.innerHTML = resp;
	
	/* Get list of table elements */ 
	var dataList = data.getElementsByTagName("table");  
	
	/* Check second table on page for number of books found */
	try {
		data2.innerHTML = dataList.item(1).innerHTML;
	}
	catch(err) {
	  return;
	}
	var booksFoundStr = data2.getElementsByTagName("font");
	
	/*** Place number of books into numBooks ***/
	/*** This combined with the prev way of  ***/
	/*** checking number of books is ridic.  ***/
	/*** inefficient, fix ***/
    var booksFoundStrCopy = booksFoundStr;
	var tempStr = (booksFoundStrCopy.item(0).innerHTML).split(" ");
	var numbBooks = tempStr[0];
	
	/* If no books found, display "no books found" */
	if(booksFoundStr.item(0).innerHTML[0] == "0") { 
		document.getElementById("refDiv").innerHTML = "<br />"+booksFoundStr.item(0).innerHTML;
	}
	/* Books found */
	else {
		var refDiv2 = document.getElementById("refDiv2");
		refDiv2.innerHTML = dataList.item(2).innerHTML;
		
		//needed data starts at index 8, these are only
		//a tags, need p tags for other data (number pages, publisher...
		//order:
		//author(s), title (ed #,isbn numbers(s)) ,download mirrors
		
		var tableDiv = document.createElement("div");
		tableDiv = dataList.item(2).getElementsByTagName("tr");
		
		
		var pageNum = Number(currPageNum);
		
		/* If showing less than the total number of books */		
		if((pageNum * 25)  < numbBooks) {
			var numBooksFoundStr = "<p id=\"booksFoundString\">"+(pageNum * 25 - 24)+" - "+(pageNum * 25)+" out of "+numbBooks+" books<p>";	
			var lastPage = false;
		}
		else {
			var numBooksFoundStr = "<p id=\"booksFoundString\">"+(pageNum * 25 - 24)+" - "+numbBooks+" out of "+numbBooks+" books<p>";	
			var lastPage = true;
		}
		
		//book data starts on tableDiv.item(1)
		var newTableStr = "";
		var tableNumber = pageNum * 25 - 24;
		for(var r = 1;r<tableDiv.length;++r) { 
			var newRowStr = "<table style=\"width:100%\">";
			var row = tableDiv.item(r);
			var columns = row.getElementsByTagName("td");
			
			for(var c = 0;c < columns.length;c++) {
				switch (c) {
				case 1: // author name(s)
					var authorList = columns[c].getElementsByTagName("a");
					newRowStr +=  "<tr><td class=\"tableNumber\" colspan=\"2\"><hr color=\"#023E4F\" size=\"1\">"+tableNumber+"<hr color=\"#023E4F\" size=\"1\"></td></tr>";
					tableNumber++;
					newRowStr += "<tr><td class=\"resultLabel\">Author(s)</td><td class=\"author resultsText\">";
					for(var a = 0;a < authorList.length;a++) {
						newRowStr += authorList[a].innerHTML;
					}
					newRowStr += "</td></tr>";
					
					break;
				case 2: // //Book title and ISN+BN #'s
					var titleList = columns[c].getElementsByTagName("a");
					
					//isolates book title
					var bookTitleStr = titleList[0].innerHTML.slice(0,titleList[0].innerHTML.indexOf("<"));
					
					//add book title to table
					newRowStr += "<tr><td class=\"resultLabel\">Title</td><td class=\"title resultsText\">"+bookTitleStr+"</td></tr>";
					
					var itemsDiv = document.createElement("div");
					itemsDiv.innerHTML = titleList[0].innerHTML;
					var itemsList = itemsDiv.getElementsByTagName("i");
				
					if(itemsList.length > 0) {
						
						for(var itemsCount = 0;itemsCount < itemsList.length;itemsCount++) {
							//not 100% sure why this works
							if(itemsList[itemsCount].innerHTML.indexOf("[")) {  //isbn numbers 
								newRowStr += "<tr><td class=\"resultLabel\">ISBN</td><td class=\"isbn resultsText\">"+itemsList[itemsCount].innerHTML+"</td></tr>";
							}
							else { //is edition number
								newRowStr += "<tr><td class=\"resultLabel\">Edition</td><td class=\"edition resultsText\">"+itemsList[itemsCount].innerHTML+"</td></tr>";
							}
						}
					}
					
					break;
				case 3: // publisher
					newRowStr += "<tr><td class=\"resultLabel\">Publisher</td><td class=\"publisher resultsText\">"+columns[c].innerHTML+"</td></tr>";
					break;
				case 4: // year
					newRowStr += "<tr><td class=\"resultLabel\">Year</td><td class=\"year resultsText\">"+columns[c].innerHTML+"</td></tr>";
					break;
				case 6: // language
					newRowStr += "<tr><td class=\"resultLabel\">Language</td><td class=\"language resultsText\">"+columns[c].innerHTML+"</td></tr>";
					break;
				case 7: // file size
					newRowStr += "<tr><td class=\"resultLabel\">File Size</td><td class=\"filesize resultsText\">"+columns[c].innerHTML+"</td></tr>";
					break;
				case 8: // file type
					newRowStr += "<tr><td class=\"resultLabel\">File Type</td><td class=\"filetype resultsText\">"+columns[c].innerHTML+"</td></tr>";
					break;
				case 9: // dl link - same
					newRowStr += "<tr><td class=\"resultLabel\">Downloads<td>"+columns[c].innerHTML;
					break;
				case 10: //dl link - http://bookzz.org/
					newRowStr += " "+columns[c].innerHTML;
					break;
				case 11: //dl link - http://libgen.info/
					newRowStr += " "+columns[c].innerHTML;
					break;
				case 12: //dl link - http://bookfi.org/
					newRowStr += " "+columns[c].innerHTML+"</td></tr>";
					break;
				}
				
			}
			newRowStr += "</table>";
			newTableStr += newRowStr;
		}
		
		/* Spooky */
		//clear data or bad things happen
		data.innerHTML = "";
		//just in case
		data2.innerHTML = "";
		
		/* Display number of books found and results table in refDiv*/
		document.getElementById("refDiv").innerHTML = numBooksFoundStr + newTableStr;
		/* Clear refDiv2 */
		document.getElementById("refDiv2").innerHTML = "";
		
		
		/** Doing stuff with the download links **/
		dlLinksList = refDiv.getElementsByTagName("a");
		
		var l = 0;
		for(var linkC = 0 ; linkC < dlLinksList.length ; linkC++) {
			/* Give each link a unique id */
			var setIDstr = l.toString();
			dlLinksList[linkC].setAttribute("id",setIDstr);
			
			var urlStr = "";
			/* Link is download direct from Library Genesis, [1] - in results */
			if(linkC == 0 || (linkC >= 4 && linkC % 4 == 0)) {
				var tempLinkStr = dlLinksList[linkC].toString();
				urlStr = "http://gen.lib.rus.ec/"+ tempLinkStr.slice(tempLinkStr.indexOf("get"));
				dlLinksList[linkC].href = urlStr;
			}
			/* Mirror download, [2] [3] [4] - in results */
			else {
				urlStr =  dlLinksList[linkC].toString();
			}
			
			/* Add on-click event listener to download links */
			dlLinksList[linkC].addEventListener("click", function() {
				openURL(this);	
			});
			
			dlLinksList[linkC].title=urlStr;
			dlLinksList[linkC].setAttribute("class","downloads");
			++l;
		}  
	}
	
	/*** Show navigation arrows (prev, next) if more than one page of results ***/
	/*** If next page increment currPageNum ***/
	var arrows   = document.getElementById("arrowDiv");
	var prvPgArr = document.getElementById("prevPageArrow");
	var nxtPgArr = document.getElementById("nextPageArrow");
	
	if(currPageNum == 1) {
	  prvPgArr.style.visibility = "hidden";
	}
	else {
		prvPgArr.style.visibility = "visible";
		/* Add prev page arrow on-click event listener */
		prvPgArr.addEventListener("click", function() {
			currPageNum--;
			handleNextArrow(searchStr, searchType, currPageNum);
		});
	}
	arrows.style.visibility = "visible";
	arrows.style.position   = "relative";
	
	if(lastPage == false) {
		nxtPgArr.style.visibility = "visible";
		/* Add next page arrow on-click event listener */
		nxtPgArr.addEventListener("click", function() {
			currPageNum++;
			handleNextArrow(searchStr, searchType, currPageNum);
		});
	}
	else {
		nxtPgArr.style.visibility = "hidden";
	}
} 

/*** Get and Display Next Page of results ***/
function handleNextArrow(searchStr, searchType, currPageNum) {
	urlStr = "http://gen.lib.rus.ec/search.php?&req="+searchStr+"&view=simple&column="+searchType+"&sort=def&sortmode=ASC&page="+currPageNum;	
	getSearchResults(urlStr, searchStr, searchType, currPageNum, false);
	window.scrollTo(0, 0);
}

/*** Get and Display Previous Page of results ***/
function handleNextArrow(searchStr, searchType, currPageNum) {
	urlStr = "http://gen.lib.rus.ec/search.php?&req="+searchStr+"&view=simple&column="+searchType+"&sort=def&sortmode=ASC&page="+currPageNum;
	getSearchResults(urlStr, searchStr, searchType, currPageNum, false);	
	window.scrollTo(0, 0);
}

/*** Handle Search button press ***/
function handleButtonPress() {
	var i = 0;
	var urlStr; // holds url for requesting search results from Library Genesis
	
	/* get string from search input form */
	var searchStr =  document.getElementById("searchText").value;
	
	/* must replace whitespace between words with "+" */ 
	searchStr = searchStr.split(" ").join("+");
	
	//http://libgen.org/search.php?req= test &open=0&view=simple&phrase=1&column=title
	
	/* Get the checked radio button and set urlStr based on checked radio button and user search string */
	if(document.getElementById("titleBtn").checked) {
		var searchType = "title"; 
		urlStr = "http://gen.lib.rus.ec/search.php?req="+searchStr+"&open=0&view=simple&column=title"
	}
	else if(document.getElementById("authorBtn").checked) {
		var searchType = "author";
		urlStr = "http://gen.lib.rus.ec/search.php?req="+searchStr+"&open=0&view=simple&column=author"
	}
	else if(document.getElementById("isbnBtn").checked) {
		var searchType = "isbn";
		urlStr = "http://gen.lib.rus.ec/search.php?req="+searchStr+"&open=0&view=simple&column=identifier"
	}
			
	/* Hide search ui */
	document.getElementById("searchText").value = "";
	document.getElementById("searchDiv").style.display="none";
	
	/* Display back arrow (return to initial search form */
	var backArrow = document.getElementById("backArrow");
	backArrow.style.visibility="visible";
	
	/* Add on click event listener for back arrow */
	/* on click: reset pop-up to initial search   */
	/*           form and show previous search    */
	/*           string in search text input form */
	backArrow.addEventListener("click", function() {
		resetExt(searchStr);		
	});

	/* Get search results from Library Genesis  */
	getSearchResults(urlStr, searchStr, searchType, 1, false);
}

/*** Intercept normal form submit behaviour ***/
/***  call handleButoonPress()              ***/
function processSearchForm(e) {
	if(e.preventDefault) e.preventDefault();
		handleButtonPress();
}

/*** Changes appearance of radio button label ***/
/***   when that radio button is selected.    ***/
function handleRadioClick(e) {
	var srchRdBtns = document.getElementsByName("searchOpt");
	for(var i = 0; i < srchRdBtns.length; i++) {
		if(srchRdBtns.item(i).checked) {
			switch(i) {
			 case 0:
				document.getElementById("lbl1").style.color = "#D7F0F7";
				document.getElementById("lbl1").style.textShadow = " 0px 0px 2px #023E4F";
				document.getElementById("lbl2").style.color = "#023E4F";
				document.getElementById("lbl2").style.textShadow = "none";
				document.getElementById("lbl3").style.color = "#023E4F";
				document.getElementById("lbl3").style.textShadow = "none";
			 break;
			 case 1:
				document.getElementById("lbl1").style.color = "#023E4F";
				document.getElementById("lbl1").style.textShadow = "none";
				document.getElementById("lbl2").style.color = "#D7F0F7";
				document.getElementById("lbl2").style.textShadow =" 0px 0px 2px #023E4F";
				document.getElementById("lbl3").style.color = "#023E4F";
				document.getElementById("lbl3").style.textShadow = "none";
			 break;
			 case 2:
				document.getElementById("lbl1").style.color = "#023E4F";
				document.getElementById("lbl1").style.textShadow = "none";
				document.getElementById("lbl2").style.color = "#023E4F";
				document.getElementById("lbl2").style.textShadow = "none";
				document.getElementById("lbl3").style.color = "#D7F0F7";
				document.getElementById("lbl3").style.textShadow = " 0px 0px 2px #023E4F";
			 break;
			}
		}
	}
}

/*** Called on pop-up ***/
/*** Adds ***/
function init() {
	var searchForm = document.getElementById("searchForm");
	
	/***Add on click event listeners for search form***/ 
	
	/* Add on-click event listener for search button*/
	searchForm.addEventListener("submit", processSearchForm);
	
    /* Add on-click event listeners for radio buttons (title,author,isbn)*/
	var searchOpts = document.getElementsByName("searchOpt");
	for(var i = 0;i < searchOpts.length;i++) {
		searchOpts[i].addEventListener("click", handleRadioClick);
	}
	
	/* Add on-click event listener for Library Genesis Link*/
	document.getElementById("libGenLink").addEventListener("click", function()
	{
		openURL(this.href);
	}); 
}

/*** START ***/
window.addEventListener("DOMContentLoaded", init, false);

