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
  var lines = selection[0]
  lines.splice(selection[2] + 1, 0, ('\n----------------\n'));
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
  let table = ('\n' + thead + '\n' + sepeator + '\n' + (row + '\n').repeat(rowNum));

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

function textEditorPreview(element, textarea, previewdiv) {
  $(previewdiv).html('<hr>' + marked($(textarea).val()) + '<hr>');
  let originalContent = '';
  if (!isPreviewed) {
    let previewButtonClone = $(element).clone();
    previewButtonClone.text("Remove Preview");
    previewButtonClone.click(function () {
      $(previewdiv).html(originalContent)
      $(this).remove();
      isPreviewed = false;
    })
    $(previewdiv).parent().append(previewButtonClone);
  }
  isPreviewed = true;
}