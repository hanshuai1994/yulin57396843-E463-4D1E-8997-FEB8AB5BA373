function merge_obj_children(obj){    //merge外部导入模型的同材质到一个数组
	mergecount=0;
	var materials_set=[];
	var geometry_set=[];
	// console.log('obj.children.length'+obj.children.length);
	for(var i=0;i<obj.children.length;i++){    //遍历所有子object
		var object_position=materials_set.indexOf(obj.children[i].material);
		if(object_position==-1){  //他不带有第一次出现的材质,新建
			
			obj.children[i].material.side=THREE.DoubleSide;//渲染两面
			
			materials_set.push(obj.children[i].material);
			geometry_set.push([obj.children[i].geometry])
			//console.log(geometry_set.length+' geometry_set.length') -->
			// console.log(geometry_set) -->
		}
		else{
			mergecount++;
			//console.log('运行了'+mergecount+'次合并到待merge数组,'+object_position);
			geometry_set[object_position].push(obj.children[i].geometry)
			//geometry_set[object_position].merge(obj.children[i].geometry,geometry_set[object_position].attributes["position"].array.length); -->
		}
	}
	
	//开始进行合并
	for(var i=0;i<geometry_set.length;i++){
		geometry_set[i] = THREE.BufferGeometryUtils.mergeBufferGeometries( geometry_set[i] );
	}
	//合并完成，进行分组
	var group=new THREE.Group();
	for(var i=0;i<geometry_set.length;i++){
		var obj=new THREE.Mesh(geometry_set[i],materials_set[i])
		group.add(obj)
		//console.log('add了一次');
	}
	
	// if(materials_set.length==1){console.warn('找到一个1材质长的了叫'+obj.name)}
	
	return group;
}
