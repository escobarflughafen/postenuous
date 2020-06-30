var isShowingRemovedComments = false;

function initComments() {
  let refers = $("a[id^=link-to]");
  for (let i = 0; i < refers.length; i++) {
    let refer = refers[i]
    $(refer).text($('#comment-no-' + $(refer).text()).text())
  }
  $("a[id^=replyto]").click(function () {
    console.log($(this).prop('href'))
    $('#replyto').val($(this).prop('id').split('-')[1])
  });
  $("a[id^=link-to-]").click(function () {
    let replytoCommentElement = $('#' + $(this).prop('href').split('#')[1]);
    replytoCommentElement.addClass('comment-emphasized');

    setTimeout(() => {
      replytoCommentElement.removeClass('comment-emphasized');
    }, 1000)
  });
}

function autoGrow(element) {
  if (element) {
    element.style.height = "5rem";
    element.style.height = ((element.scrollHeight >= 320) ? 320 : element.scrollHeight) + "px";
  }
}

function initAutoGrow(element) {
  if (element) {
    $(element).click(undefined)
    autoGrow(element);
  }
}


function addComment(element) {
  let params = {
    isAjax: true,
    comment: $('#commenteditfield').val(),
    replyto: $('#replyto').val(),
    name: $('#commentauthor').val(),
    homepage: $('#commentauthorhomepage').val()
  }
  $(element).prop('disabled', true);
  $.ajax({
    url: window.location.href.split('#')[0] + '/addcomment',
    type: 'POST',
    dateType: 'json',
    data: params
  }).done(function (data) {
    $('#comments-area').html(data.comments);
    $('#replyto').html(data.replytoOptions);
    initComments();
    $('#comment-count').text('comments (' + data.commentsCount + ')')
    $(element).prop('disabled', false);
  }).fail(() => {
    alert('BadRequest')
    $(element).prop('disabled', false);
  })
}


function removeComment(element) {
  var commentID = element.id.split('-');
  commentID = commentID[commentID.length - 1]

  let params = {
    isAjax: true,
    'commentID': commentID,
    'isShowingRemovedComments': isShowingRemovedComments
  }

  $(element).addClass('disabled')
  $.ajax({
    url: window.location.href.split('#')[0] + '/removecomment',
    type: 'POST',
    dateType: 'json',
    data: params
  }).done(function (data) {
    $('#comments-area').html(data.comments);
    $('#replyto').html(data.replytoOptions);
    $('#comment-count').text('comments (' + data.commentsCount + ')');
  }).fail(() => {
    alert('BadRequest')
    $(element).removeClass('disabled')
  })

}

function toggleComment(element) {
  var commentID = element.id.split('-');
  commentID = commentID[commentID.length - 1]

  let params = {
    isAjax: true,
    'commentID': commentID,
    'isShowingRemovedComments': isShowingRemovedComments
  }

  $(element).addClass('disabled')
  $.ajax({
    url: window.location.href.split('#')[0] + '/togglecomment',
    type: 'POST',
    dateType: 'json',
    data: params
  }).done(function (data) {
    $('#comments-area').html(data.comments);
    $('#replyto').html(data.replytoOptions);
    $('#comment-count').text('comments (' + data.commentsCount + ')');
    initComments()
  }).fail(() => {
    alert('BadRequest')
    $(element).removeClass('disabled')
  })

}


function toggleDisabledCommentsVisibility(element, showAll = true) {

  let params = {
    isAjax: true,
    showDisabledComments: !isShowingRemovedComments
  }

  $(element).addClass('disabled')

  $.ajax({
    url: window.location.href.split('#')[0] + '/toggleallcomment',
    type: 'POST',
    dateType: 'json',
    data: params
  }).done(function (data) {
    $('#comments-area').html(data.commentsHTML);
    $('#replyto').html(data.replytoOptions);
    $(element).removeClass('disabled')
    initComments()
    isShowingRemovedComments = !isShowingRemovedComments
  }).fail((message) => {
    console.log(window.location.href)
    console.log(message)
    alert('BadRequest: ' + message.toString())
    $(element).removeClass('disabled')
  })
}

function saveToDraft(element) {
  let params = {
    isAjax: true,
    draftID: $('#draftselector').val(),
    title: $('#titlefield').val(),
    abstract: $('#brieffield').val(),
    tags: $('#tagsfield').val(),
    body: $('#posteditfield').val(),
    isPrivate: $('#privatepostcheckbox').prop('checked'),
    disableComment: $('#disablecommentcheckbox').prop('checked')
  };

  if ($('#newdraftcheckbox').prop('checked')) {
    params.draftID = 'new'
  }

  $(element).addClass('disabled');
  $(element).val("Saving...");

  $.ajax({
    url: '/savetodraft',
    type: 'POST',
    dateType: 'json',
    data: params
  }).done(function (data) {
    var draft = JSON.parse(data)
    if ($('#newdraftcheckbox').prop('checked') || $('#draftselector').val() == 'new') {
      $('#newdraftcheckbox').prop('checked', false);
      $('#draftselector').append("<option value='" + draft.id + "'>" + draft.title + ' - ' + draft.abstract + "</option> ");
      $('#draftselector').val(draft.id)
    } else {
      $("option[value='" + params.draftID + "']").text(params.title + ' - ' + params.abstract);
    }
    setTimeout(() => {
      $('#preview-btn').click();
      $(element).removeClass('disabled');
      $(element).val("Save to Drafts")
    }, 200);
  })
}

function getDraft(element) {
  var draftID = $(element).val();
  if (draftID != 'new') {
    let params = {
      isAjax: true,
      draftID: draftID
    }
    $(element).addClass('disabled');
    $.ajax({
      url: '/getdraft',
      type: 'POST',
      dateType: 'json',
      data: params
    }).done(function (data) {
      let draft = JSON.parse(data)
      $('#titlefield').val(draft.title);
      $('#brieffield').val(draft.abstract);
      $('#tagsfield').val(draft.tags);
      $('#posteditfield').val(draft.body);
      $('#privatepostcheckbox').prop('checked', draft.isPrivate);
      $('#disablecommentcheckbox').prop('checked', draft.disableComment);
      $('#preview-btn').click();
      $(element).removeClass('disabled');
    })
  }

}

function getPostHistory(element) {
  var historyIndex = $(element).val();
  if (historyIndex != 'new') {
    historyIndex = parseInt(historyIndex)
    let params = {
      isAjax: true,
      postID: window.location.href.split('/')[4],
      i: historyIndex
    }
    $(element).addClass('disabled');
    $.ajax({
      url: '/gethistory',
      type: 'POST',
      dateType: 'json',
      data: params
    }).done(function (data) {
      let historyPost = JSON.parse(data)
      $('#titlefield').val(historyPost.title);
      $('#brieffield').val(historyPost.abstract);
      $('#tagsfield').val(historyPost.tags);
      $('#posteditfield').val(historyPost.body);
      $('#preview-btn').click();
      $(element).removeClass('disabled');
    })
  }

}


function toggleSign(element, sign1, sign2, haveCollapse = false) {
  var sign = $(element).text();
  if (sign != sign1 && sign != sign2) {
    $(element).text(sign1)
  } else {
    if (haveCollapse) {
      var collapseObject = $('#collapse-' + $(element).prop('id').split('-')[1]);
      collapseObject.collapse('toggle');
    }
    $(element).text((sign == sign1) ? sign2 : sign1)
  }
}


function latencyTest(element) {
  if (element) $(element).addClass('disabled')

  var sendEpoch = Date.now();
  $.ajax({
    url: window.location.href,
    type: 'POST',
    dataType: 'json',
    data: { padding: 'helloworld' }
  }).done(function (data) {
    var returnEpoch = Date.now();
    $('#toserverresult').text('=' + String(data.atServer - sendEpoch) + 'ms=>');
    $('#toclientresult').text('=' + String(returnEpoch - data.atServer) + 'ms=>');
    $('#loopbackresult').text(String(returnEpoch - sendEpoch) + 'ms');
    if (element) $(element).removeClass('disabled')
  })
}