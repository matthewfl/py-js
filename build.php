<?php
header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past
header("Content-Type: application/javascript")
?>
////////////////////////
// Javascript Python  //
// Build with a PHP script
////////////////////////

<?php

$load = array ('base.js', 'compile.js', 'interface.js');

foreach ($load as $b=>$a) {
	readfile($a);
	echo "\n\n/////////////////////////////////////////////////////////////////////////////////////////////////////////\n\n";	
}