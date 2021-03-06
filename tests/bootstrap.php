<?php
/**
 * PHPUnit bootstrap file
 *
 * @package Drip_Woocommerce
 */

$drip_woocommerce_tests_dir = getenv( 'WP_TESTS_DIR' );

if ( ! $drip_woocommerce_tests_dir ) {
	$drip_woocommerce_tests_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
}

if ( ! file_exists( $drip_woocommerce_tests_dir . '/includes/functions.php' ) ) {
	echo "Could not find $drip_woocommerce_tests_dir/includes/functions.php, have you run bin/install-wp-tests.sh ?" . PHP_EOL; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	exit( 1 );
}

// Give access to tests_add_filter() function.
require_once $drip_woocommerce_tests_dir . '/includes/functions.php';

/**
 * Manually load the plugin being tested.
 */
function drip_woocommerce_manually_load_plugin() {
	require __dir__ . '/../drip.php';
}
tests_add_filter( 'muplugins_loaded', 'drip_woocommerce_manually_load_plugin' );

// Start up the WP testing environment.
require $drip_woocommerce_tests_dir . '/includes/bootstrap.php';
