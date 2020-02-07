<?php
class WC_Settings_Drip {
  const NAME = "woocommerce-settings-drip";
  const ACCOUNT_ID_KEY = "account_id";

  /**
   * Bootstraps the class and hooks required actions & filters.
   *
   */
  public static function init() {
    add_filter( 'woocommerce_settings_tabs_array', __CLASS__ . '::add_settings_tab', 50 );
    add_action( 'woocommerce_settings_tabs_settings_drip', __CLASS__ . '::settings_tab' );
    //add_action( 'woocommerce_update_options_settings_drip', __CLASS__ . '::update_settings' );
    add_filter( 'woocommerce_settings_groups', __CLASS__ . '::settings_group');
    add_filter( 'woocommerce_settings-drip', __CLASS__ . '::settings_group_options');
  }


  /**
   * Add a new settings tab to the WooCommerce settings tabs array.
   *
   * @param array $settings_tabs Array of WooCommerce setting tabs & their labels, excluding the Subscription tab.
   * @return array $settings_tabs Array of WooCommerce setting tabs & their labels, including the Subscription tab.
   */
  public static function add_settings_tab( $settings_tabs ) {
    $settings_tabs['settings_drip'] = __( 'Drip', self::NAME );
    return $settings_tabs;
  }


  /**
   * Uses the WooCommerce admin fields API to output settings via the @see woocommerce_admin_fields() function.
   *
   * @uses woocommerce_admin_fields()
   * @uses self::get_settings()
   */
  public static function settings_tab() {
    woocommerce_admin_fields( self::get_settings() );
  }


  /**
   * Uses the WooCommerce options API to save settings via the @see woocommerce_update_options() function.
   *
   * @uses woocommerce_update_options()
   * @uses self::get_settings()
   */
  public static function update_settings() {
    woocommerce_update_options( self::get_settings() );
  }

  /**
   * Register the `drip` settings group.
   */
  public static function settings_group( $locations ) {
    $locations[] = array(
      'id'          => 'drip',
      'label'       => __( 'Drip', self::NAME ),
      'description' => __( 'Drip Settings', self::NAME ),
    );
    return $locations;
  }

  /**
   * Register options under `drip` settings group.
   */
  public static function settings_group_options( $settings ) {
    $settings[] = array(
      'id'          => self::ACCOUNT_ID_KEY,
      'option_key'  => self::ACCOUNT_ID_KEY,
      'label'       => __( 'Account ID', self::NAME ),
      'description' => __( 'Drip Account ID', self::NAME ),
      'default'     => '',
      'type'        => 'number',
    );
    return $settings;
  }

  /**
   * Get all the settings for this plugin for @see woocommerce_admin_fields() function.
   *
   * @return array Array of settings for @see woocommerce_admin_fields() function.
   */
  public static function get_settings() {
    $settings = array(
      'section_title' => array(
        'id'   => 'wc_settings_drip_section_title',
        'name' => __( 'Drip', self::NAME ),
        'type' => 'title',
        'desc' => '',
      ),
      self::ACCOUNT_ID_KEY => array(
        'id'   => self::ACCOUNT_ID_KEY,
        'name' => __( 'Account ID', self::NAME ),
        'type' => 'number',
        'desc' => __( 'Read-only, visible if integration was successful', self::NAME ),
        'custom_attributes' => array('readonly' => 'readonly'),
      ),
      'section_end' => array(
        'type' => 'sectionend',
        'id'   => 'wc_settings_drip_section_end'
      )
    );

    return apply_filters( 'wc_settings_drip_settings', $settings );
  }
}
