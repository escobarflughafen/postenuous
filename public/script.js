/*$('#input_date').keypress(function(e){ 
    　　if(e.keyCode=='13'){ 
    　　　　$.ajax({
    　　　　　　type: "POST",
    　　　　　　url: "inquire_date.php", 
    　　　　　　data: { 
    　　　　　　　　birth:null,
     //1.获取用户请求（即某些事件），发送到服务器处理
    　　　　　　　date:$('#input_date input').val()
    　　　　　　},
    　　　　　　dataType: "json",
    //2.从服务器获取数据
    　　　　　　success: function(data){
     　　　　　　　　if (data.success) {
     　　　　　　　　　　var festival = data.fetivalInquireResult; 
    //3.将获取的数据载入页面，实现页面事件响应刷新
    　　　　　　　　　　$('#show_festival').text(festival);
    　　　　　　　　} else {
    　　　　　　　　　$('#show_festival').text("获取节日失败")
    　　　　　　} 
    　　　},//欢迎加入全栈开发交流群一起学习交流：619586920
    　　　　　　error: function(jqXHR){     
      　　　　　　alert("发生错误：" + jqXHR.status);  
    　　　　　　},     
    　　　　});
    　　$('#festival').hide();
    　　$('#response_festival').show();
    　　} 
    });
*/
/*
function autoGrow(element, defaultHeight, limitedHeight) {
  if (element) {
    element.style.height = defaultHeight;
    element.style.height = ((element.scrollHeight >= limitedHeight) ? limitedHeight : element.scrollHeight + "px");
  }
}
*/

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
/*
function setCollapse(togglerElement, collapseElement) {
  if (togglerElement && collapseElement) {
    $(togglerElement).click( () => {
      $(collapseElement).
    })
  }
}
*/


function removeComment(element) {
  var commentID = element.id.split('-');
  commentID = commentID[commentID.length - 1]

  let params = {
    isAjax: true,
    'commentID': commentID
  }

  $(element).addClass('disabled')
  $.ajax({
    url: window.location.href + '/removecomment',
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

function showComment(element) {
  var commentID = element.id.split('-');
  commentID = commentID[commentID.length - 1]

  let params = {
    isAjax: true,
    'commentID': commentID
  }

  $(element).addClass('disabled')
  $.ajax({
    url: window.location.href + '/showcomment',
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

function toggleDisabledCommentsVisibility(element) {
  if($(element).prop('show-all') == undefined) {
    $(element).prop('show-all', true)
  }
  let params = {
    isAjax: true,
    showDisabledComments: $(element).prop('show-all')
  }
  /*
  if ($(element).prop('show-all')) {
    $(element).text('hide removed comments');
  } else {
    $(element).text('show removed comments');
  }
  */
  $(element).addClass('disabled')

  $.ajax({
    url: window.location.href + '/toggleallcomment',
    type: 'POST',
    dateType: 'json',
    data: params
  }).done(function (data) {
    console.log(data)
    $('#comments-area').html(data.commentsHTML);
    $('#replyto').html(data.replytoOptions);
    $(element).prop('show-all', !$(element).prop('show-all'));
    $(element).removeClass('disabled')
    $(element).text(($(element).prop('show-all')) ? 'show disabled comments' : 'hide disabled comments' )
    init()
  }).fail(() => {
    alert('BadRequest')
    $(element).removeClass('disabled')
  })
}
