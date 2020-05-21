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