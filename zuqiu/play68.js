
function play68_init() {
	updateShare(0);
}

function goHome() {
	window.location.href = HOME_PATH;
}

function play68_submitScore(score) {
	updateShareScore(score);
	setTimeout( function() { show_share(); }, 1500 )
}

function updateShare(bestScore) {
	imgUrl = '';
	lineLink = '';
	descContent = "�����һ������ָָ������";
	updateShareScore(bestScore);
	appid = '';
}

function updateShareScore(bestScore) {
	if(bestScore > 0) {
		shareTitle = "���桶�������򡷹���" + bestScore + "�أ����Ե���������棡";
	}
	else{
		shareTitle = "���籭�쵽�ˣ������桶�������򡷣����Ե���������棡";
	}
}