var isShowingRemovedComments = false;
var isTextChanged = true;
var tempDraft = {
  title: '',
  brief: '',
  tags: '',
  body: ''
}



function ackTextChanged(element) {
  isTextChanged = !isTextChanged;
}

function renewTempDraft() {
  if (isTextChanged) {
    tempDraft = {
      title: $('#titlefield').val(),
      abstract: $('#brieffield').val(),
      tags: $('#tagsfield').val(),
      body: $('#posteditfield').val(),
    }
    isTextChanged = false;
  }
}

function setTempDraft() {
  $('#titlefield').val(tempDraft.title);
  $('#brieffield').val(tempDraft.abstract);
  $('#tagsfield').val(tempDraft.tags);
  $('#posteditfield').val(tempDraft.body);
}

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
  renewTempDraft();
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
  } else {
    setTempDraft();
  }

}

function getPostHistory(element) {
  renewTempDraft();
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
  } else {
    setTempDraft();
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

function getTextareaSelection(taElem) {
  var sStart = taElem.selectionStart;
  var sEnd = taElem.selectionEnd;
  var lines = taElem.value.split('\n');
  var lnStart = 0, lnEnd = 0, chCounter = 0, i = 0;

  for (; i < lines.length; i++) {
    chCounter += lines[i].length + 1;
    if (chCounter >= sStart) {
      lnStart = i;
      break;
    }
  }

  if (chCounter >= sEnd) {
    lnEnd = i;
  } else {
    for (i = i + 1; i < lines.length; i++) {
      chCounter += lines[i].length + 1;
      if (chCounter >= sEnd) {
        lnEnd = i;
        break;
      }
    }
  }

  return [lines, lnStart, lnEnd, sStart, sEnd];
}


function textEditorAddStyle(element, textarea, markdownSyntax) {
  var editorElem = $(textarea)[0];

  var sStart = editorElem.selectionStart, sEnd = editorElem.selectionEnd;

  let text = editorElem.value.slice(0, sStart)
    + markdownSyntax
    + editorElem.value.slice(sStart, sEnd)
    + markdownSyntax
    + editorElem.value.slice(sEnd, editorElem.value.length);

  editorElem.value = text;
  editorElem.focus();
  editorElem.setSelectionRange(sStart + markdownSyntax.length, sEnd + markdownSyntax.length);
}

function textEditorAddHyperlink(element, textarea) {
  var editorElem = $(textarea)[0];

  var text = "";
  var sStart = editorElem.selectionStart;
  var sEnd = editorElem.selectionEnd;
  if (sStart == sEnd) {
    text = editorElem.value.slice(0, sStart)
      + "[ caption ]( hyperlink )"
      + editorElem.value.slice(sStart, editorElem.value.length);
  } else {
    text = editorElem.value.slice(0, sStart)
      + "[ caption ]("
      + editorElem.value.slice(sStart, sEnd).split('\n').join('')
      + ")"
      + editorElem.value.slice(sEnd, editorElem.value.length);
  }

  editorElem.value = text;
  editorElem.focus();
  editorElem.setSelectionRange(sStart + 1, sStart + 10);
}

function textEditorAddLinePrefix(element, textarea, prefix) {
  var editorElem = $(textarea)[0];
  var selection = getTextareaSelection(editorElem);   // selection array [lines, lnStart, lnEnd, selStart, selEnd]
  var lines = selection[0];
  for (let i = selection[1]; i <= selection[2]; i++) {
    lines[i] = prefix + ' ' + lines[i];
  }

  editorElem.value = lines.join('\n');
  editorElem.focus();
  editorElem.setSelectionRange(selection[3], selection[3]);
}

function textEditorInsertHorizontalLine(element, textarea) {
  var editorElem = $(textarea)[0];
  var selection = getTextareaSelection(editorElem);   // selection array [lines, lnStart, lnEnd, selStart, selEnd]
  var lines = selection[0];
  lines.splice(selection[2] + 1, 0, '\n----------------\n')
  editorElem.value = lines.join('\n');
  editorElem.focus();
  editorElem.setSelectionRange(selection[3], selection[3]);
}

function textEditorInsertTable(element, textarea, rowNum, colNum) {
  var editorElem = $(textarea)[0];
  var selection = getTextareaSelection(editorElem);   // selection array [lines, lnStart, lnEnd, selStart, selEnd]
  var lines = selection[0];
  let thead = "|  ".repeat(colNum) + "|";
  let sepeator = "| - ".repeat(colNum) + "|";
  let row = "|  ".repeat(colNum) + "|";
  let table = thead + '\n' + sepeator + '\n' + (row + '\n').repeat(rowNum);

  lines.splice(selection[2] + 1, 0, table);

  editorElem.value = lines.join('\n');
  editorElem.focus();
  editorElem.setSelectionRange(selection[3], selection[3] + table.length + 2 + rowNum);
}

function textEditorAddCode(element, textarea) {
  var editorElem = $(textarea)[0];

  var text = "";
  var sStart = editorElem.selectionStart;
  var sEnd = editorElem.selectionEnd;
  if (sStart == sEnd) {
    text = editorElem.value.slice(0, sStart)
      + "``` ```"
      + editorElem.value.slice(sStart, editorElem.value.length);
  } else {
    text = editorElem.value.slice(0, sStart)
      + "```"
      + editorElem.value.slice(sStart, sEnd)
      + "```"
      + editorElem.value.slice(sEnd, editorElem.value.length);
  }

  editorElem.value = text;
  editorElem.focus();
  if (sStart == sEnd) {
    editorElem.setSelectionRange(sStart + 3, sStart + 4);
  } else {
    editorElem.setSelectionRange(sStart + 3, sEnd + 3);
  }
}

function textEditorUploadPhoto(element, fileinput) {
  var fileinputElem = $(fileinput)[0];
  fileinputElem.click();
}

function handlePhotoUpload(elem, uploadBtn, textarea) {
  var editorElem = $(textarea)[0];
  var photos = $(elem).prop('files');

  var text = "";
  var sStart = editorElem.selectionStart;
  var sEnd = editorElem.selectionEnd;

  let postID = window.location.href.split('/');
  postID = postID[postID.length - 2];


  // formData configure as req.body
  var formData = new FormData();
  formData.append('file', photos[0]);
  formData.append('filename', photos[0].name.split(' ').join('_'));
  formData.append('path', 'posts/' + postID + '/')
  formData.append('isAjax', true);

  $(uploadBtn).addClass('disabled');

  $.ajax({
    url: '/upload',
    data: formData,
    cache: false,
    contentType: false,
    processData: false,
    type: 'POST',
  }).done((url) => {
    let caption = ' caption '
    if (sStart != sEnd) {
      caption = editorElem.value.slice(sStart, sEnd);
    }

    text = editorElem.value.slice(0, sStart)
      + "![" + caption + "]("
      + url
      + ")"
      + editorElem.value.slice(sEnd, editorElem.value.length);
    editorElem.value = text;
    editorElem.focus();
    editorElem.setSelectionRange(sStart + 2, sStart + caption.length + 2);
    $(uploadBtn).removeClass('disabled');

  }).fail((msg) => {
    alert('failed with uploading ' + photos[0].name);
    $(uploadBtn).removeClass('disabled');
  })
}