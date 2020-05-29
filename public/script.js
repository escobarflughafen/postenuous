var isShowingRemovedComments = false;

function init() {
  let refers = $("a[id^=link-to]");
  for (let i = 0; i < refers.length; i++) {
    let refer = refers[i]
    $(refer).text($('#comment-no-' + $(refer).text()).text())
  }
  $("a[id^=replyto").click(function () {
    console.log($(this).prop('href'))
  });
  $("a[id^=link-to-").click(function () {
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
    init()
  }).fail(() => {
    alert('BadRequest')
    $(element).removeClass('disabled')
  })

}

/*
function toggleDisabledCommentsVisibility(element, showAll = true) {

  let params = {
    isAjax: true,
    showDisabledComments: showAll
  }

  $(element).addClass('disabled')

  $.ajax({
    url: window.location.href + '/toggleallcomment',
    type: 'POST',
    dateType: 'json',
    data: params
  }).done(function (data) {
    $('#comments-area').html(data.commentsHTML);
    $('#replyto').html(data.replytoOptions);
    $(element).removeClass('disabled')
    init()
  }).fail((message) => {
    console.log(message)
    alert('BadRequest: ' + message.toString())
    $(element).removeClass('disabled')
  })
}*/


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
    init()
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
    if ($('#newdraftcheckbox').prop('checked')) {
      $('#newdraftcheckbox').prop('checked', false);
      $('#draftselector').append("<option value='"+ draft.id +"'>" + draft.title + ' - ' + draft.abstract + "</option> ");
      $('#draftselector').val(draft.id)
    } else {
      $("option[value='" + params.draftID + "']").text(params.title + ' - ' + params.abstract);

    }
    setTimeout(() => {
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
      $(element).removeClass('disabled');
    })
  }

}