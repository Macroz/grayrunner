goog.provide('grunner.core');
goog.require('cljs.core');
/**
* Recursively transforms ClojureScript maps into Javascript objects,
* other ClojureScript colls into JavaScript arrays, and ClojureScript
* keywords into JavaScript strings.
*/
grunner.core.clj__GT_js = (function clj__GT_js(x){
if(cljs.core.string_QMARK_.call(null,x))
{return x;
} else
{if(cljs.core.keyword_QMARK_.call(null,x))
{return cljs.core.name.call(null,x);
} else
{if(cljs.core.map_QMARK_.call(null,x))
{return cljs.core.reduce.call(null,(function (m,p__4423){
var vec__4424__4425 = p__4423;
var k__4426 = cljs.core.nth.call(null,vec__4424__4425,0,null);
var v__4427 = cljs.core.nth.call(null,vec__4424__4425,1,null);
return cljs.core.assoc.call(null,m,clj__GT_js.call(null,k__4426),clj__GT_js.call(null,v__4427));
}),cljs.core.ObjMap.fromObject([],{}),x).strobj;
} else
{if(cljs.core.coll_QMARK_.call(null,x))
{return cljs.core.apply.call(null,cljs.core.array,cljs.core.map.call(null,clj__GT_js,x));
} else
{if("\uFDD0'else")
{return x;
} else
{return null;
}
}
}
}
}
});
grunner.core.data = cljs.core.atom.call(null,cljs.core.ObjMap.fromObject(["\uFDD0'player","\uFDD0'view","\uFDD0'score","\uFDD0'dead?"],{"\uFDD0'player":cljs.core.ObjMap.fromObject(["\uFDD0'x","\uFDD0'y","\uFDD0'vx","\uFDD0'vy","\uFDD0'jumping"],{"\uFDD0'x":500,"\uFDD0'y":200,"\uFDD0'vx":100,"\uFDD0'vy":0,"\uFDD0'jumping":0}),"\uFDD0'view":cljs.core.ObjMap.fromObject(["\uFDD0'x","\uFDD0'y"],{"\uFDD0'x":0,"\uFDD0'y":0}),"\uFDD0'score":0,"\uFDD0'dead?":false}));
grunner.core.gee = cljs.core.atom.call(null,null);
grunner.core.ctx = cljs.core.atom.call(null,null);
grunner.core.circle = (function circle(x,y,radx,rady){
cljs.core.deref.call(null,grunner.core.ctx).save();
cljs.core.deref.call(null,grunner.core.ctx).scale(1.0,(rady / radx));
cljs.core.deref.call(null,grunner.core.ctx).beginPath();
cljs.core.deref.call(null,grunner.core.ctx).arc(x,((y * radx) / rady),radx,0,(2.0 * Math.PI),true);
cljs.core.deref.call(null,grunner.core.ctx).closePath();
cljs.core.deref.call(null,grunner.core.ctx).fill();
return cljs.core.deref.call(null,grunner.core.ctx).restore();
});
grunner.core.line = (function line(x1,y1,x2,y2){
cljs.core.deref.call(null,grunner.core.ctx).beginPath();
cljs.core.deref.call(null,grunner.core.ctx).moveTo(x1,y1);
cljs.core.deref.call(null,grunner.core.ctx).lineTo(x2,y2);
cljs.core.deref.call(null,grunner.core.ctx).closePath();
return cljs.core.deref.call(null,grunner.core.ctx).stroke();
});
grunner.core.line2 = (function line2(x1,y1,x2,y2){
cljs.core.deref.call(null,grunner.core.ctx).moveTo(x1,y1);
return cljs.core.deref.call(null,grunner.core.ctx).lineTo(x2,y2);
});
grunner.core.rectangle2 = (function rectangle2(x1,y1,x2,y2){
cljs.core.deref.call(null,grunner.core.ctx).moveTo(x1,y1);
cljs.core.deref.call(null,grunner.core.ctx).lineTo(x2,y1);
cljs.core.deref.call(null,grunner.core.ctx).lineTo(x2,y2);
return cljs.core.deref.call(null,grunner.core.ctx).lineTo(x1,y2);
});
grunner.core.on_screen_QMARK_ = (function on_screen_QMARK_(p__4428){
var map__4429__4430 = p__4428;
var map__4429__4431 = ((cljs.core.seq_QMARK_.call(null,map__4429__4430))?cljs.core.apply.call(null,cljs.core.hash_map,map__4429__4430):map__4429__4430);
var x__4432 = cljs.core.get.call(null,map__4429__4431,"\uFDD0'x");
var y__4433 = cljs.core.get.call(null,map__4429__4431,"\uFDD0'y");
var width__4434 = cljs.core.deref.call(null,grunner.core.gee).width;
var height__4435 = cljs.core.deref.call(null,grunner.core.gee).height;
var and__3546__auto____4436 = (0 < (x__4432 + 1));
if(and__3546__auto____4436)
{var and__3546__auto____4437 = (x__4432 < (width__4434 + 1));
if(and__3546__auto____4437)
{var and__3546__auto____4438 = (0 < (y__4433 + 1));
if(and__3546__auto____4438)
{return (y__4433 < (height__4435 + 1));
} else
{return and__3546__auto____4438;
}
} else
{return and__3546__auto____4437;
}
} else
{return and__3546__auto____4436;
}
});
grunner.core.seeded_rand_int = (function seeded_rand_int(x,n){
var alea__4439 = (new Alea(x));
var int_generator__4440 = alea__4439.uint32;
return (int_generator__4440.call(null) % n);
});
grunner.core.width_stream = (function width_stream(p__4441){
var vec__4442__4443 = p__4441;
var previous_x__4444 = cljs.core.nth.call(null,vec__4442__4443,0,null);
var previous_width__4445 = cljs.core.nth.call(null,vec__4442__4443,1,null);
var previous_height__4446 = cljs.core.nth.call(null,vec__4442__4443,2,null);
return (20 * (grunner.core.seeded_rand_int.call(null,previous_x__4444,8) + 1));
});
grunner.core.height_stream = (function height_stream(p__4447){
var vec__4448__4449 = p__4447;
var previous_x__4450 = cljs.core.nth.call(null,vec__4448__4449,0,null);
var previous_width__4451 = cljs.core.nth.call(null,vec__4448__4449,1,null);
var previous_height__4452 = cljs.core.nth.call(null,vec__4448__4449,2,null);
var new_height__4453 = (previous_height__4452 + ((10 * grunner.core.seeded_rand_int.call(null,previous_x__4450,10)) - 50));
if((new_height__4453 < 0))
{return 0;
} else
{return new_height__4453;
}
});
grunner.core.level_stream = (function level_stream(previous){
var x__4454 = cljs.core.first.call(null,previous);
var width__4455 = grunner.core.width_stream.call(null,previous);
var height__4456 = grunner.core.height_stream.call(null,previous);
return (new cljs.core.LazySeq(null,false,(function (){
return cljs.core.cons.call(null,cljs.core.PersistentVector.fromArray([x__4454,width__4455,height__4456]),level_stream.call(null,cljs.core.PersistentVector.fromArray([(x__4454 + width__4455),width__4455,height__4456])));
})));
});
grunner.core.level_data = cljs.core.take.call(null,1000,grunner.core.level_stream.call(null,cljs.core.PersistentVector.fromArray([0,100,100])));
grunner.core.test = (function test(){
return console.log([cljs.core.str(grunner.core.level_data)].join(''));
});
grunner.core.get_level_data = (function get_level_data(x,w){
var x__4457 = x;
var w__4458 = w;
var lx__4459 = 0;
var cw__4460 = 0;
var datas__4461 = grunner.core.level_data;
var return$__4462 = cljs.core.PersistentVector.fromArray([]);
while(true){
var vec__4463__4464 = cljs.core.first.call(null,datas__4461);
var cx__4465 = cljs.core.nth.call(null,vec__4463__4464,0,null);
var width__4466 = cljs.core.nth.call(null,vec__4463__4464,1,null);
var height__4467 = cljs.core.nth.call(null,vec__4463__4464,2,null);
if((w__4458 <= cw__4460))
{return return$__4462;
} else
{if((x__4457 <= (cx__4465 + width__4466)))
{{
var G__4468 = x__4457;
var G__4469 = w__4458;
var G__4470 = (cx__4465 + width__4466);
var G__4471 = (cw__4460 + width__4466);
var G__4472 = cljs.core.rest.call(null,datas__4461);
var G__4473 = cljs.core.conj.call(null,return$__4462,cljs.core.PersistentVector.fromArray([cx__4465,width__4466,height__4467]));
x__4457 = G__4468;
w__4458 = G__4469;
lx__4459 = G__4470;
cw__4460 = G__4471;
datas__4461 = G__4472;
return$__4462 = G__4473;
continue;
}
} else
{{
var G__4474 = x__4457;
var G__4475 = w__4458;
var G__4476 = (cx__4465 + width__4466);
var G__4477 = cw__4460;
var G__4478 = cljs.core.rest.call(null,datas__4461);
var G__4479 = return$__4462;
x__4457 = G__4474;
w__4458 = G__4475;
lx__4459 = G__4476;
cw__4460 = G__4477;
datas__4461 = G__4478;
return$__4462 = G__4479;
continue;
}
}
}
break;
}
});
grunner.core.collides_with_level_QMARK_ = (function collides_with_level_QMARK_(x,y){
var vec__4480__4481 = cljs.core.first.call(null,grunner.core.get_level_data.call(null,x,1));
var lx__4482 = cljs.core.nth.call(null,vec__4480__4481,0,null);
var width__4483 = cljs.core.nth.call(null,vec__4480__4481,1,null);
var height__4484 = cljs.core.nth.call(null,vec__4480__4481,2,null);
return (y < height__4484);
});
grunner.core.on_ground_QMARK_ = (function on_ground_QMARK_(x,y){
var vec__4485__4486 = cljs.core.first.call(null,grunner.core.get_level_data.call(null,x,1));
var lx__4487 = cljs.core.nth.call(null,vec__4485__4486,0,null);
var width__4488 = cljs.core.nth.call(null,vec__4485__4486,1,null);
var height__4489 = cljs.core.nth.call(null,vec__4485__4486,2,null);
return (y <= (height__4489 + 1.5));
});
grunner.core.simulate = (function simulate(){
var map__4490__4493 = cljs.core.deref.call(null,grunner.core.data).call(null,"\uFDD0'player");
var map__4490__4494 = ((cljs.core.seq_QMARK_.call(null,map__4490__4493))?cljs.core.apply.call(null,cljs.core.hash_map,map__4490__4493):map__4490__4493);
var x__4495 = cljs.core.get.call(null,map__4490__4494,"\uFDD0'x");
var y__4496 = cljs.core.get.call(null,map__4490__4494,"\uFDD0'y");
var vx__4497 = cljs.core.get.call(null,map__4490__4494,"\uFDD0'vx");
var vy__4498 = cljs.core.get.call(null,map__4490__4494,"\uFDD0'vy");
var jump_QMARK___4499 = cljs.core.get.call(null,map__4490__4494,"\uFDD0'jump?");
var jumping__4500 = cljs.core.get.call(null,map__4490__4494,"\uFDD0'jumping");
var dt__4501 = (1.0 / 60.0);
var ax__4502 = 100;
var ay__4503 = (-9.81 * 100.0);
var ground_QMARK___4504 = grunner.core.on_ground_QMARK_.call(null,x__4495,y__4496);
var jvy__4506 = (cljs.core.truth_((function (){var and__3546__auto____4505 = jump_QMARK___4499;
if(cljs.core.truth_(and__3546__auto____4505))
{return ground_QMARK___4504;
} else
{return and__3546__auto____4505;
}
})())?(Math.min.call(null,(jumping__4500 + 2),8) * 100):0);
var nvx__4507 = (vx__4497 + (ax__4502 * dt__4501));
var nvy__4508 = ((vy__4498 + jvy__4506) + (ay__4503 * dt__4501));
var nx__4509 = (x__4495 + (nvx__4507 * dt__4501));
var ny__4510 = (y__4496 + (nvy__4508 * dt__4501));
var vvx__4511 = Math.max.call(null,cljs.core.get_in.call(null,cljs.core.deref.call(null,grunner.core.data),cljs.core.PersistentVector.fromArray(["\uFDD0'view","\uFDD0'vx"]),1),(nvx__4507 * dt__4501));
var vec__4491__4512 = cljs.core.first.call(null,grunner.core.get_level_data.call(null,x__4495,1));
var lx__4513 = cljs.core.nth.call(null,vec__4491__4512,0,null);
var width__4514 = cljs.core.nth.call(null,vec__4491__4512,1,null);
var height__4515 = cljs.core.nth.call(null,vec__4491__4512,2,null);
var min_view_x__4516 = 500;
var vec__4492__4517 = (cljs.core.truth_(grunner.core.collides_with_level_QMARK_.call(null,nx__4509,ny__4510))?(cljs.core.truth_(grunner.core.collides_with_level_QMARK_.call(null,nx__4509,y__4496))?(cljs.core.truth_(grunner.core.collides_with_level_QMARK_.call(null,x__4495,ny__4510))?cljs.core.PersistentVector.fromArray([x__4495,y__4496,0,(((nvy__4508 < 0))?0:nvy__4508),true]):cljs.core.PersistentVector.fromArray([x__4495,ny__4510,0,nvy__4508,true])):cljs.core.PersistentVector.fromArray([nx__4509,(((ny__4510 < height__4515))?height__4515:y__4496),nvx__4507,0,true])):cljs.core.PersistentVector.fromArray([nx__4509,ny__4510,nvx__4507,nvy__4508,false]));
var x__4518 = cljs.core.nth.call(null,vec__4492__4517,0,null);
var y__4519 = cljs.core.nth.call(null,vec__4492__4517,1,null);
var vx__4520 = cljs.core.nth.call(null,vec__4492__4517,2,null);
var vy__4521 = cljs.core.nth.call(null,vec__4492__4517,3,null);
var collided_QMARK___4522 = cljs.core.nth.call(null,vec__4492__4517,4,null);
cljs.core.swap_BANG_.call(null,grunner.core.data,(function (){
return cljs.core.assoc_in.call(null,cljs.core.deref.call(null,grunner.core.data),cljs.core.PersistentVector.fromArray(["\uFDD0'player","\uFDD0'x"]),x__4518);
}));
cljs.core.swap_BANG_.call(null,grunner.core.data,(function (){
return cljs.core.assoc_in.call(null,cljs.core.deref.call(null,grunner.core.data),cljs.core.PersistentVector.fromArray(["\uFDD0'player","\uFDD0'y"]),y__4519);
}));
cljs.core.swap_BANG_.call(null,grunner.core.data,(function (){
return cljs.core.assoc_in.call(null,cljs.core.deref.call(null,grunner.core.data),cljs.core.PersistentVector.fromArray(["\uFDD0'player","\uFDD0'vx"]),vx__4520);
}));
cljs.core.swap_BANG_.call(null,grunner.core.data,(function (){
return cljs.core.assoc_in.call(null,cljs.core.deref.call(null,grunner.core.data),cljs.core.PersistentVector.fromArray(["\uFDD0'player","\uFDD0'vy"]),vy__4521);
}));
if((jumping__4500 >= 0))
{cljs.core.swap_BANG_.call(null,grunner.core.data,(function (data){
return cljs.core.update_in.call(null,data,cljs.core.PersistentVector.fromArray(["\uFDD0'player","\uFDD0'jumping"]),cljs.core.inc);
}));
} else
{}
if(cljs.core.truth_(jump_QMARK___4499))
{cljs.core.swap_BANG_.call(null,grunner.core.data,(function (data){
return cljs.core.assoc_in.call(null,data,cljs.core.PersistentVector.fromArray(["\uFDD0'player","\uFDD0'jumping"]),0);
}));
} else
{}
cljs.core.swap_BANG_.call(null,grunner.core.data,(function (data){
return cljs.core.assoc_in.call(null,data,cljs.core.PersistentVector.fromArray(["\uFDD0'player","\uFDD0'jump?"]),false);
}));
cljs.core.swap_BANG_.call(null,grunner.core.data,(function (data){
return cljs.core.update_in.call(null,data,cljs.core.PersistentVector.fromArray(["\uFDD0'view","\uFDD0'vx"]),cljs.core.max,vvx__4511);
}));
cljs.core.swap_BANG_.call(null,grunner.core.data,(function (data){
return cljs.core.update_in.call(null,data,cljs.core.PersistentVector.fromArray(["\uFDD0'view","\uFDD0'x"]),(function (old){
if(((old + min_view_x__4516) < x__4518))
{return (x__4518 - min_view_x__4516);
} else
{return (old + vvx__4511);
}
}));
}));
if((x__4518 < cljs.core.get_in.call(null,cljs.core.deref.call(null,grunner.core.data),cljs.core.PersistentVector.fromArray(["\uFDD0'view","\uFDD0'x"]))))
{cljs.core.swap_BANG_.call(null,grunner.core.data,(function (){
return cljs.core.assoc_in.call(null,cljs.core.deref.call(null,grunner.core.data),cljs.core.PersistentVector.fromArray(["\uFDD0'dead?"]),true);
}));
} else
{}
return cljs.core.swap_BANG_.call(null,grunner.core.data,(function (){
return cljs.core.assoc_in.call(null,cljs.core.deref.call(null,grunner.core.data),cljs.core.PersistentVector.fromArray(["\uFDD0'score"]),Math.round.call(null,x__4518));
}));
});
grunner.core.draw = (function draw(){
if(cljs.core.truth_(cljs.core.deref.call(null,grunner.core.data).call(null,"\uFDD0'dead?")))
{} else
{grunner.core.simulate.call(null);
}
var screen_width__4523 = cljs.core.deref.call(null,grunner.core.gee).width;
var screen_height__4524 = cljs.core.deref.call(null,grunner.core.gee).height;
var view_x__4525 = cljs.core.get_in.call(null,cljs.core.deref.call(null,grunner.core.data),cljs.core.PersistentVector.fromArray(["\uFDD0'view","\uFDD0'x"]));
cljs.core.deref.call(null,grunner.core.ctx).fillStyle = "rgb(70, 75, 75)";
cljs.core.deref.call(null,grunner.core.ctx).fillRect(0,0,screen_width__4523,screen_height__4524);
cljs.core.deref.call(null,grunner.core.ctx).fillStyle = "rgb(255, 255, 255)";
cljs.core.deref.call(null,grunner.core.ctx).strokeStyle = "rgba(255, 255, 255, 0.2)";
cljs.core.deref.call(null,grunner.core.ctx).fillStyle = "rgb(255, 255, 255)";
cljs.core.deref.call(null,grunner.core.ctx).font = "bold 30px sans-serif";
cljs.core.deref.call(null,grunner.core.ctx).textAlign = "left";
cljs.core.deref.call(null,grunner.core.ctx).textBaseline = "middle";
cljs.core.deref.call(null,grunner.core.ctx).font = "20pt Courier New";
cljs.core.deref.call(null,grunner.core.ctx).fillText([cljs.core.str("fps "),cljs.core.str(Math.round.call(null,cljs.core.deref.call(null,grunner.core.gee).frameRate))].join(''),50,20);
cljs.core.deref.call(null,grunner.core.ctx).fillText([cljs.core.str("score "),cljs.core.str(cljs.core.deref.call(null,grunner.core.data).call(null,"\uFDD0'score"))].join(''),50,50);
cljs.core.deref.call(null,grunner.core.ctx).fillText([cljs.core.str("jumping "),cljs.core.str(cljs.core.get_in.call(null,cljs.core.deref.call(null,grunner.core.data),cljs.core.PersistentVector.fromArray(["\uFDD0'player","\uFDD0'jumping"])))].join(''),50,80);
cljs.core.deref.call(null,grunner.core.ctx).font = "normal 18px sans-serif";
cljs.core.deref.call(null,grunner.core.ctx).strokeStyle = "rgb(255, 255, 255)";
cljs.core.deref.call(null,grunner.core.ctx).fillStyle = "rgb(255, 255, 255)";
var levels__4526 = grunner.core.get_level_data.call(null,view_x__4525,(1.5 * screen_width__4523));
cljs.core.dorun.call(null,cljs.core.map.call(null,(function (p__4527){
var vec__4528__4529 = p__4527;
var x__4530 = cljs.core.nth.call(null,vec__4528__4529,0,null);
var width__4531 = cljs.core.nth.call(null,vec__4528__4529,1,null);
var height__4532 = cljs.core.nth.call(null,vec__4528__4529,2,null);
var x__4533 = (x__4530 - view_x__4525);
cljs.core.deref.call(null,grunner.core.ctx).beginPath();
grunner.core.rectangle2.call(null,x__4533,((screen_height__4524 - height__4532) - 200),(x__4533 + width__4531),screen_height__4524);
cljs.core.deref.call(null,grunner.core.ctx).closePath();
cljs.core.deref.call(null,grunner.core.ctx).fillStyle = "rgb(100, 100, 100)";
return cljs.core.deref.call(null,grunner.core.ctx).fill();
}),levels__4526));
cljs.core.deref.call(null,grunner.core.ctx).strokeStyle = "rgb(255, 255, 255)";
cljs.core.deref.call(null,grunner.core.ctx).fillStyle = "rgb(255, 255, 255)";
var map__4534__4535 = cljs.core.deref.call(null,grunner.core.data).call(null,"\uFDD0'player");
var map__4534__4536 = ((cljs.core.seq_QMARK_.call(null,map__4534__4535))?cljs.core.apply.call(null,cljs.core.hash_map,map__4534__4535):map__4534__4535);
var player_x__4537 = cljs.core.get.call(null,map__4534__4536,"\uFDD0'x");
var player_y__4538 = cljs.core.get.call(null,map__4534__4536,"\uFDD0'y");
var jumping__4539 = cljs.core.get.call(null,map__4534__4536,"\uFDD0'jumping");
var x__4540 = (player_x__4537 - view_x__4525);
var s__4541 = (20 - Math.min.call(null,jumping__4539,5));
grunner.core.circle.call(null,x__4540,(((screen_height__4524 - player_y__4538) - 200) - s__4541),15,15);
if(cljs.core.truth_(cljs.core.deref.call(null,grunner.core.data).call(null,"\uFDD0'dead?")))
{cljs.core.deref.call(null,grunner.core.ctx).textAlign = "center";
cljs.core.deref.call(null,grunner.core.ctx).font = "60pt Courier New";
return cljs.core.deref.call(null,grunner.core.ctx).fillText([cljs.core.str("G A M E  O V E R")].join(''),(screen_width__4523 / 2),(screen_height__4524 / 2));
} else
{return null;
}
});
grunner.core.move = (function move(){
return cljs.core.swap_BANG_.call(null,grunner.core.data,(function (){
return cljs.core.assoc.call(null,cljs.core.deref.call(null,grunner.core.data),"\uFDD0'tx",cljs.core.deref.call(null,grunner.core.gee).mouseX,"\uFDD0'ty",cljs.core.deref.call(null,grunner.core.gee).mouseY);
}));
});
grunner.core.keydown = (function keydown(){
var map__4542__4543 = cljs.core.deref.call(null,grunner.core.data).call(null,grunner.core.player);
var map__4542__4544 = ((cljs.core.seq_QMARK_.call(null,map__4542__4543))?cljs.core.apply.call(null,cljs.core.hash_map,map__4542__4543):map__4542__4543);
var x__4545 = cljs.core.get.call(null,map__4542__4544,"\uFDD0'x");
var y__4546 = cljs.core.get.call(null,map__4542__4544,"\uFDD0'y");
var jumping__4547 = cljs.core.get.call(null,map__4542__4544,"\uFDD0'jumping");
if(cljs.core.truth_((function (){var and__3546__auto____4548 = grunner.core.on_ground_QMARK_.call(null,x__4545,y__4546);
if(cljs.core.truth_(and__3546__auto____4548))
{return cljs.core._EQ_.call(null,0,jumping__4547);
} else
{return and__3546__auto____4548;
}
})()))
{return cljs.core.swap_BANG_.call(null,grunner.core.data,(function (){
return cljs.core.assoc_in.call(null,cljs.core.deref.call(null,grunner.core.data),cljs.core.PersistentVector.fromArray(["\uFDD0'player","\uFDD0'jumping"]),1);
}));
} else
{return null;
}
});
grunner.core.keyup = (function keyup(){
return cljs.core.swap_BANG_.call(null,grunner.core.data,(function (){
return cljs.core.assoc_in.call(null,cljs.core.deref.call(null,grunner.core.data),cljs.core.PersistentVector.fromArray(["\uFDD0'player","\uFDD0'jump?"]),true);
}));
});
grunner.core.start = (function start(){
cljs.core.swap_BANG_.call(null,grunner.core.gee,(function (){
return (new window.GEE(grunner.core.clj__GT_js.call(null,cljs.core.ObjMap.fromObject(["\uFDD0'fullscreen","\uFDD0'context"],{"\uFDD0'fullscreen":true,"\uFDD0'context":"2d"}))));
}));
cljs.core.swap_BANG_.call(null,grunner.core.ctx,(function (){
return cljs.core.deref.call(null,grunner.core.gee).ctx;
}));
cljs.core.deref.call(null,grunner.core.gee).draw = grunner.core.draw;
cljs.core.deref.call(null,grunner.core.gee).frameTime = "50";
cljs.core.deref.call(null,grunner.core.gee).keydown = grunner.core.keydown;
return cljs.core.deref.call(null,grunner.core.gee).keyup = grunner.core.keyup;
});
