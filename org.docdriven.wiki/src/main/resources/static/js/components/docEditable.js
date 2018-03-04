Vue.component('doc-editable',{
  template: [
    '<div>',
    ' <div class="doc-editable"'+
    '   v-show="active"',
    '   contenteditable="true"',
    '   @input="update">{{editableContent}}'+
    ' </div>',
    ' <div v-show="!active">{{content}}</div>',
    '</div>'
  ].join('\n'),
  props:['content','active'],
  data:function(){
    return {
      editableContent: this.content
    }
  },
  watch: {
    content: function(newContent){
      if(!this.active) {
        this.editableContent = newContent;
      }
    }
  },
  methods:{
    update:function(event){
      this.$emit('update',event.target.innerText);
    }
  }
});