// ==UserScript==
// @name         wfh log automator
// @namespace    http://saltfish.moe/
// @version      0.7.2
// @license      WTFPLv2
// @description  automate create and complete wfh issues
// @author       SaltfishAmi
// @match        *://*/projects/*/issues*
// @match        *://*/issues/*
// @grant        none
// ==/UserScript==

// ******** FOR USER CONFIG, JUMP TO LINE 220. ******** //
// ******** FOR USER CONFIG, JUMP TO LINE 220. ******** //
// ******** FOR USER CONFIG, JUMP TO LINE 220. ******** //
// ******** FOR USER CONFIG, JUMP TO LINE 220. ******** //
// ******** FOR USER CONFIG, JUMP TO LINE 220. ******** //

// jQuery is expected to be present on the page, but is avoided while possible;
// all usage must be accompanied with a comment explicitly mentioning `jQuery'

// I am not any vanilla JavaScript zealot thing; I use this coding style merely
// because I had never learned jQuery in the past.

// this coding style originated from the golden old times when we had only 10GB
// quota for the campus internet each month. because of the buggy systems of the
// university, all students in a whole sub-campus were not able to look up the
// curriculum for the upcoming semester, until one month after that semester
// began. the website that I wrote and operated, which acted as an alternative
// and looks up the curriculum smoothly, was basically a necessity for the whole
// sub-campus. therefore the usage was high (10k+ access/day in the particular
// month), and I decided that I'd not use any external library as to reduce the
// data quota footprint for me, my users and my cheap vps (unless my handwritten
// code should exceed the external library in size, which, is quite unlikely to
// happen). although I no longer need to squeeze out every byte from the code
// in my current use case, still, I don't know any other way to code JavaScript.

// as a C++ programmer I was really tempted to use TS for its strict typing,
// but it introduces a compilation process, which seems to be such a chore for
// this simple project, so just let it be. maybe I'll rewrite it in the future.

{
  'use strict';
  // Text translation
  class Translation {
    constructor(lang) {
      if (lang === "zh") {
        // 中文
        this.may_ask_autofill_new_issue
          = "是否自动填写新问题？";
        this.prompt_enter_issue_desc
          = "请输入问题描述：";
        // this.alert_select_watchers
        //   = "请手动选择关注者！";
        this.may_ask_submit_new_issue
          = "是否立即提交新问题？";
        this.alert_submit_new_issue
          = "问题已填写完毕，请手动提交！";
        this.may_ask_create_new_issue
          = "是否创建一个问题？";
        this.may_ask_open_existing_issue
          = "是否打开已有的问题？";
        this.may_ask_autofill_existing_issue
          = "是否自动填写已有的问题？";
        this.confirm_current_issue_is_desired
          = "当前页面的问题是否确实是需要自动化处理的问题？"
        this.may_ask_update_issue_desc_in_existing_issue
          = "是否更新当前问题描述？";
        this.may_ask_time_entry_hours
          = "请输入今日工时，以小时为单位。\n取消该对话框以使用“预期时间”作为今日工时。";
        this.may_ask_use_issue_desc_as_time_entry_comments
          = "是否使用“问题描述”自动生成工时日志注释？";
        this.prompt_time_entry_comments
          = "请手动输入工时日志注释：";
        this.may_ask_submit_existing_issue
          = "是否立即提交当前问题？";
        this.alert_submit_existing_issue
          = "问题已填写完毕，请手动提交！";

        this.custom = new class {
          constructor() {
            this.prompt_enter_workday_summary
              = "请输入日总结：";
          }
        };
        return;
      }

      // fallback to English
      this.may_ask_autofill_new_issue
        = "Do you want the new issue to be filled automatically?";
      this.prompt_enter_issue_desc
        = "Please enter issue description: ";
      // this.alert_select_watchers
      //   = "Please select your watchers manually!";
      this.may_ask_submit_new_issue
        = "Do you want to submit the new issue now?";
      this.alert_submit_new_issue
        = "The issue has been filled, please submit it manually!";
      this.may_ask_create_new_issue
        = "Do you want to create a new issue now?";
      this.may_ask_open_existing_issue
        = "Do you want to open your existing issue now?";
      this.may_ask_autofill_existing_issue
        = "Do you want your existing issue to be filled automatically?";
      this.confirm_current_issue_is_desired
        = "Is this your desired issue for automatic processing?"
      this.may_ask_update_issue_desc_in_existing_issue
        = "Do you want to update the issue description?";
      this.may_ask_time_entry_hours
        = "Please enter the time you worked today, in hours. \nCancel the dialog to use estimated hours as time entry hours.";
      this.may_ask_use_issue_desc_as_time_entry_comments
        = "Do you want to use your issue description as work time entry comments?";
      this.prompt_time_entry_comments
        = "Please enter comments for work time entry: ";
      this.may_ask_submit_existing_issue
        = "Do you want to submit this existing issue now?";
      this.alert_submit_existing_issue
        = "The issue has been filled, please submit it manually!";
      this.custom = new class {
        constructor() {
          this.prompt_enter_workday_summary
            = "Please enter workday summary: ";
        }
      };
    }
  };

  // config definitions and default values
  const today = new Date();

  const WATCHER_HINT = 0;
  const WATCHER_EXACT_NAME = 1

  const ask = undefined;

  function may_ask_yesno(input, message) {
    if (input === ask) {
      if (confirm(message) === true) {
        return true;
      }
      return false;
    } else {
      return input;
    }
  }

  function may_ask_string(input, message, preset = "") {
    if (input === ask) {
      if (input = prompt(message, preset)) {
        return input;
      }
      return preset;
    } else {
      return input;
    }
  }

  class Config {
    constructor() {
      this.language = "en";

      this.features = new class Features {
        constructor() {
          this.enable_create_new_issue = false;
          this.enable_autofill_new_issue = false;
          this.enable_auto_submit_new_issue = false;
          this.enable_redirect_to_existing_issue = false;
          this.enable_autofill_existing_issue = false;
          this.enable_auto_submit_existing_issue = false;
        }
      }();

      this.timeout = new class Timeout {
        constructor() {
          this.init = 1000;
          this.field = 200;
          this.popup = 800;
          this.update = 1000;
        }
      }();

      this.content = new class Content {
        constructor() {
          this.date_number
            = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
          this.project_group_name = "undefined";
          this.issue_subject_prefix = "无名氏-居家办公计划";
          this.issue_subject_suffix = String(today.getFullYear())
            .concat("0".concat(String(today.getMonth() + 1)).slice(-2))
            .concat("0".concat(String(today.getDate())).slice(-2));
          this.get_issue_subject = () => {
            return this.issue_subject_prefix.concat(this.issue_subject_suffix);
          }
          this.issue_desc_filter_func = (input) => {
            return input;
          };
          this.estimated_hours = "8";
          this.watchers = [["wumingshi", "无 名氏"]];
          this.update_issue_desc_in_existing_issue = true;
          this.update_issue_desc_in_existing_issue_filter_func = (desc) => {
            return desc;
          }
          this.time_entry_hours = "8";
          this.time_entry_activity_id = "10";
          this.time_entry_activity_text = "编码"; // TODO: locale-dependent
          this.issue_done_ratio = "100";
          this.use_issue_desc_as_time_entry_comments = true;
          this.use_issue_desc_as_time_entry_comments_filter_func = (desc) => {
            return desc;
          }
        }
      }();

      this.debug = new class Debug {
        constructor() {
          this.enable = false;
        }
      }();
    }
  };

  const config = new Config();

  //                                 ------
  //
  //                             config section
  // refer to the config definition section for default values

  //   language (string)
  // set the language of various prompts and alerts text among the script
  //
  config.language = "zh";

  const texts = new Translation(config.language);

  //
  //                             features config
  // enable or disable specific features at your need

  //   enable_create_new_issue (bool | ask)
  // at the issue list page, automatically start creating a new issue if no
  // appropriate worklog issue exists
  //
  config.features.enable_create_new_issue = true;

  //   enable_autofill_new_issue (bool | ask)
  // at the new issue creation page, automatically fill up the new issue with
  // your contents
  //
  config.features.enable_autofill_new_issue = true;

  //   enable_auto_submit_new_issue (bool | ask)
  // at the new issue creation page, automatically submit your new issue after
  // filling it up. requires `enable_autofill_new_issue' be true
  // // requires `content.watchers' not be ask
  //
  config.features.enable_auto_submit_new_issue = ask;

  //   enable_redirect_to_existing_issue (bool | ask)
  // at the issue list page, automatically jump to your existing worklog issue
  // if such issue was found
  //
  config.features.enable_redirect_to_existing_issue = true;

  //   enable_autofill_existing_issue (bool | ask)
  // at the existing issue page, automatically fill the issue up, mark it as
  // completed, and record your work hours
  //
  config.features.enable_autofill_existing_issue = true;

  //   enable_auto_submit_existing_issue (bool | ask)
  // at the existing issue page, automatically submit your new issue after
  // filling everything up. requires `enable_autofill_existing_issue' be true
  //
  config.features.enable_auto_submit_existing_issue = ask;


  //
  //                           timeout config
  // configure the timeout before/after certain operations, in milliseconds

  //   init (int)
  // the time to wait before the whole process begin
  //
  config.timeout.init = 200;

  //   field (int)
  // the time to wait after filling some field (textbox etc.)
  //
  config.timeout.field = 200;

  //   popup (int)
  // the time to wait for a popup windows to appear after triggering it
  //
  config.timeout.popup = 800;

  //   update (int)
  // the time to wait for some info to update on the page,
  // e.g. after selecting an item from a dropdown list
  //
  config.timeout.update = 1000;


  //
  //                           content config
  // configure the content you actually want to fill into your work logs

  //   project_group_name (string)
  // the project group name,
  // must be exactly same as the * in the url `{redmine_root}/projects/*/issues'
  //
  config.content.project_group_name = "example-remote-work";

  //   issue_subject_prefix (string)
  // the prefix for your issue subject (title/name).
  //
  config.content.issue_subject_prefix = "无名氏-居家办公计划";

  //   issue_subject_suffix (string)
  // the suffix for your issue subject (title/name).
  //
  config.content.issue_subject_suffix = String(today.getFullYear())
    .concat("0".concat(String(today.getMonth() + 1)).slice(-2))
    .concat("0".concat(String(today.getDate())).slice(-2));

  //   get_issue_subject (function() => string)
  // the function that generates the final issue subject (title/name),
  // usually derived from `issue_subject_prefix' and `issue_subject_prefix'
  //
  // to enter manually, just use `return prompt(...);',
  // but this could leadto interruptions unexpected consequences!
  // for your information, this is used in:
  // 1) filling in the subject field - when filling a new issue
  // 2) identifying your existing issue - at issue list page
  // 3) identifying your existing issue - at issue details page
  // obviously you don't want a prompt inputbox in case 2 and 3.
  //
  config.content.get_issue_subject = () => { // TODO: less functions in config
    return config.content.issue_subject_prefix
      .concat(config.content.issue_subject_suffix);
  }

  //   issue_desc_filter_func (function(string) => string)
  // the filter function to apply while copying your input from the prompt
  // dialog to the issue description textarea
  // if you don't want to use a filter, just make it return the input as-is
  //
  config.content.issue_desc_filter_func = (input) => {
    return "## 日计划\n- "
      .concat(input.replace(/; /g, "\n- ")); // TODO: translation // TODO: decouple or recouple?
  };

  //   estimated_hours (string)
  // the estimate hours for your issue, in hours, as a string
  // used when creating the new issue
  //
  config.content.estimated_hours = "8";

  //   watchers ([[string, string], [string, string], ...])
  // the watchers to select in the add watcher dialog
  // param1: the text that you use to search for your watcher in the dialog
  // param2: the exact full displayed name of your watcher
  // example:
  //   config.content.watchers = [
  //     ["zhangsan", "张 三"],
  //     ["lisi", "李 四"]
  //   ];
  // // autosubmitting is disabled if this is set to ask
  //
  config.content.watchers = [
    ["laoban", "老 板"]
  ];

  //   update_issue_desc_in_existing_issue (bool | ask)
  // whether to update the issue description while finalizing the existing issue
  // if true, the original description will be filtered through
  // `update_issue_desc_in_existing_issue_filter_func'
  //
  config.content.update_issue_desc_in_existing_issue = true;

  //   update_issue_desc_in_existing_issue_filter_func
  //     (function(string) => string)
  //
  // a custom function to process your issue description when updating an
  // existing issue. requires `update_issue_desc_in_existing_issue' be true
  //
  // to enter manually, just use `return prompt(...);'
  config.content.update_issue_desc_in_existing_issue_filter_func = (desc) => {
    assert(config.content.update_issue_desc_in_existing_issue === true,
      "update_issue_desc_in_existing_issue is not enabled, "
        .concat("but the filter is being used"));
    const input = prompt(texts.custom.prompt_enter_workday_summary); // TODO: decouple or recouple?
    return desc
      .concat("\n\n## 日总结\n- ") // TODO: translation // TODO: decouple or recouple?
      .concat(input.replace(/; /g, "\n- "));
  }

  //   time_entry_hours (string | ask)
  // the actual hours that you claim to have worked for, when you close the
  // issue after a day's work, in hours, as a string
  //
  config.content.time_entry_hours = "7.5";

  //   time_entry_activity_id (string)
  // the activity id to use when you register your work hours, as a string
  //
  config.content.time_entry_activity_id = "10";

  //   time_entry_activity_text (string)
  // corresponding text for the activity id you chose in the last item
  // must be an exact match
  // currently used only for confirmation
  //
  config.content.time_entry_activity_text = "编码"; // TODO: locale-dependent

  //   issue_done_ratio (string)
  // the "done ratio" of the issue on its closing, in percents, without the %
  // mark, as string
  //
  config.content.issue_done_ratio = "100";

  //   use_issue_desc_as_time_entry_comments (bool | ask)
  // whether you want to use the issue description as your comments when you do
  // work time entry. if set to false, you will be prompted to enter comments
  //
  config.content.use_issue_desc_as_time_entry_comments = true;

  //   use_issue_desc_as_time_entry_comments_filter_func
  //     (function(string) => string)
  // a custom function to process your issue description when using it as time
  // entry comments. only used if `use_issue_desc_as_time_entry_comments' true
  // if you don't want to use a filter, just make it return the input as-is
  //
  config.content.use_issue_desc_as_time_entry_comments_filter_func = (desc) => {
    assert(config.content.use_issue_desc_as_time_entry_comments === true,
      "use_issue_desc_as_time_entry_comments is not enabled, "
        .concat("but the filter is being used"));
    return desc.split("\n## 日总结\n")[1] // TODO: translation // TODO: decouple or recouple?
      .replace(/^- /, "").replace(/\n- /g, "; ");
  };


  //
  //                           debugging config
  // configure debugging features

  //   enable (bool)
  // turns on logging and assertion if this flag is true
  //
  config.debug.enable = false;


  //
  //                         end of config section
  //
  //                                ------


  // debugging functions

  let log = (...a) => { };
  let assert = (a, b) => { };

  if (config.debug.enable === true) {
    log = (...msg) => {
      console.log(...msg);
    };

    assert = (expr, msg = "") => {
      if (!expr) {
        alert("assertion failed!\n".concat(msg));
        throw new Error("Failed assertion:\n".concat(msg));
      }
    };
  }

  // utility functions

  function _$e(id) {
    return document.getElementById(id);
  }

  function $e(id) {
    const e = _$e(id);
    assert(e != null, "unable to find ".concat(id));
    return e;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // specific functions

  const CONTINUE_TRAVERSE = true;
  const STOP_TRAVERSE = false;

  const TRAVERSE_COMPLETED = true;
  const TRAVERSE_INTERRUPTED = false;

  function traverse_collection(collection, handler) {
    for (let entry of collection) {
      if (handler(entry) === STOP_TRAVERSE) {
        return TRAVERSE_INTERRUPTED;
      }
    }

    return TRAVERSE_COMPLETED;
  }

  function try_find_from_collection(collection, criteria) {
    let result = undefined;
    traverse_collection(collection, (entry) => {
      if (criteria(entry) === true) {
        result = entry;
        return STOP_TRAVERSE;
      }

      return CONTINUE_TRAVERSE;
    });

    return result;
  }

  function find_from_collection(collection, criteria) {
    const result = try_find_from_collection(collection, criteria);

    assert(result !== undefined, "failed to find_from_collection(): \n"
      .concat(String(criteria))
      .concat("\nfrom ")
      .concat(String(collection))
    );

    return result;
  }


  // utility variables

  const click = new MouseEvent("click", {
    view: window,
    bubbles: true,
    cancelable: true
  });


  async function select_from_combobox(
    select2_name, select2_option, postcondition) {
    // this uses jQuery $ in order to control `select2' component pragmatically
    const select2_obj = $("#".concat(select2_name));
    select2_obj.val(select2_option);
    select2_obj.trigger("change");
    await sleep(config.timeout.update);

    if (postcondition === undefined) {
      return;
    }

    assert(postcondition(),
      "postcondition not satisfied for select_from_combobox(): "
        .concat(String(postcondition)));
  }

  // main function

  (async function () {

    await sleep(config.timeout.init);

    if (window.location.pathname.startsWith("/projects/"
      .concat(config.content.project_group_name)
      .concat("/issues/new"))) {
      // creating a new issue
      if (may_ask_yesno(config.features.enable_autofill_new_issue,
        texts.may_ask_autofill_new_issue) === false) {
        log("autofilling new issue is disabled, nothing to do here...");
        return;
      }

      // start issue autofill
      log("autofilling new issue...");

      // subject
      const subject = $e("issue_subject");
      subject.value = config.content.get_issue_subject();

      // description
      const desc = $e("issue_description");
      const desc_input = prompt(texts.prompt_enter_issue_desc);
      desc.value = config.content.issue_desc_filter_func(desc_input);
      await sleep(config.timeout.field);

      // assign-to
      const assign_to_me = find_from_collection(
        $e("issue_assigned_to_id").parentElement.children,
        (e) => {
          return e.tagName === "A" && e.className.includes("assign-to-me-link");
        }
      );
      assign_to_me.dispatchEvent(click);
      await sleep(config.timeout.update);

      // due date
      const due_date = $e("issue_due_date");
      due_date.valueAsNumber = config.content.date_number;
      await sleep(config.timeout.field);

      // estimated hours
      const estimated_hours = $e("issue_estimated_hours");
      estimated_hours.value = config.content.estimated_hours;
      await sleep(config.timeout.field);

      // add watchers
      // open dialog
      const add_watcher = find_from_collection(
        find_from_collection($e("watchers_form").children, (e) => {
          return e.tagName === "SPAN"
            && e.className.includes("search_for_watchers");
        }).children,
        (e) => {
          return e.tagName === "A" && e.className.includes("icon-add-bullet");
        }
      );
      add_watcher.dispatchEvent(click);
      await sleep(config.timeout.popup);

      //if (config.content.watchers === ask) {
      //  alert(texts.alert_select_watchers);
      //  if (config.features.enable_auto_submit_new_issue === true) {
      //    log("autosubmitting disabled due to watcher set to ask, stopping...");
      //  }
      //  return;
      //} else {
      // filter by search query string
      const watcher_hint = $e("user_search");
      for (const watcher of config.content.watchers) {
        watcher_hint.value = watcher[WATCHER_HINT];
        await sleep(config.timeout.update);

        // check on the checkbox for desired watcher
        // TODO?: error handling
        const my_watcher = find_from_collection(
          $e("users_for_watcher").children,
          (e) => { return e.innerText === watcher[WATCHER_EXACT_NAME]; }
        );
        const checkbox = find_from_collection(my_watcher.children, (e) => {
          return e.type === "checkbox";
        });
        checkbox.checked = true;
        await sleep(config.timeout.update);
      }

      // confirm add watchers and close dialog
      const watcher_add_confirm = find_from_collection(
        find_from_collection($e("new-watcher-form").children, (e) => {
          return e.tagName === "P" && e.className.includes("buttons");
        }).children,
        (e) => { return e.type === "submit"; }
      );
      watcher_add_confirm.click();
      await sleep(config.timeout.update);
      //}

      // autofill complete, submit new issue
      log("new issue filled");
      if (may_ask_yesno(config.features.enable_auto_submit_new_issue,
        texts.may_ask_submit_new_issue) === false) {
        alert(texts.alert_submit_new_issue);
        log("autosubmitting new issue is disabled, stopping...");
        return;
      }

      log("submitting new issue...");
      const submit = find_from_collection($e("issue-form").children, (e) => {
        return e.type === "submit" && e.name === "commit";
      });
      submit.click();

      return;
    } else if (window.location.pathname.startsWith("/projects/"
      .concat(config.content.project_group_name)
      .concat("/issues"))) {
      // on the issue list page
      log("this is the issue list page");
      if (config.features.enable_redirect_to_existing_issue === false
        && config.features.enable_create_new_issue === false) {
        // there is nothing to do on this page
        log("nothing to do here...");
        return;
      }

      // first check if filter is active
      log("check if filter is active...");

      const author_filter = _$e("tr_author_id");
      if (author_filter === null) {
        // filter is not active, set filter for self
        log("set filter for self");
        await select_from_combobox("add_filter_select", "author_id",
          () => { return _$e("tr_author_id") != null; }
        );
      }

      // check both open and closed issues to avoid duplication!
      const status_filter = _$e("tr_status_id");
      // if null, ok; if non-null, make it null
      if (status_filter != null) {
        // filter is active, remove it
        log("remove filter for status");
        const status_checkbox = $e("cb_status_id");
        status_checkbox.checked = false;
        await sleep(config.timeout.update);
      }

      if (author_filter === null || status_filter != null) {
        const apply_filters = find_from_collection(
          find_from_collection($e("query_form_with_buttons").children, (e) => {
            return e.tagName === "P" && e.className.includes("buttons");
          }).children,
          (e) => {
            return e.tagName === "A" && e.className === "icon icon-checked";
          }
        );
        apply_filters.dispatchEvent(click);

        return;
      }

      // filter already active, traverse through the issue list
      assert(author_filter != null && status_filter === null);
      log("filter for self is active, process the issue list...");

      let target = undefined;

      const issue_list = try_find_from_collection($e("content").children,
        (e) => {
          return e.tagName === "FORM" && e.action.endsWith("issues")
            && !e.name.startsWith("query");
        }
      );

      if (issue_list != undefined) {
        // issue list contains at least one item
        log("traverse issue list...");

        // traverse and get issue link url
        const table = find_from_collection(
          issue_list.getElementsByClassName("list issues"),
          (e) => { return e.tagName === "TABLE"; }
        );

        const subject_text = config.content.get_issue_subject();
        traverse_collection(table.tBodies[0].children, (tr) => {
          const td = find_from_collection(tr.children, (e) => {
            return e.tagName === "TD" && e.className.includes("subject");
          });
          if (td.innerText === subject_text) {
            const subject_link = find_from_collection(td.children, (e) => {
              return e.tagName === "A";
            });

            target = subject_link.href;
            return STOP_TRAVERSE;
          }

          return CONTINUE_TRAVERSE;
        });
      } else {
        // no issue present
        log("issue list is empty!")
      }

      if (target === undefined) {
        // create a new issue
        if (may_ask_yesno(config.features.enable_create_new_issue,
          texts.may_ask_create_new_issue) === false) {
          log("creating new issue is disabled, stopping...");
          return;
        }
        log("issue for today is not found, create a new one...");

        const new_issue_btn = find_from_collection(
          find_from_collection($e("content").children, (e) => {
            return e.tagName === "DIV" && e.className.includes("contextual");
          }).children,
          (e) => {
            return e.tagName === "A" && e.className.includes("new-issue");
          }
        );
        new_issue_btn.dispatchEvent(click);
      } else {
        // process the existing issue
        if (may_ask_yesno(config.features.enable_redirect_to_existing_issue,
          texts.may_ask_open_existing_issue) === false) {
          log("opening existing issue is disabled, stopping...");
          return;
        }
        log("issue for today exists, continue processing...");

        window.location.href = target;
      }

      return;
    } else if (window.location.pathname.startsWith("/issues/")) {
      // process an existing issue by first checking for eligibility
      if (may_ask_yesno(config.features.enable_autofill_existing_issue,
        texts.may_ask_autofill_existing_issue) === false) {
        log("autofilling existing issue is disabled, nothing to do here...");
        return;
      }

      log("this is an existing issue, check for eligibility...");

      let title = undefined;
      traverse_collection($e("content").children, (e) => {
        if (e.tagName === "DIV") {
          if (e.className.includes("issue")
            && e.className.includes("details")) {
            return traverse_collection(e.children, (f) => {
              if (f.tagName === "DIV" && f.className === "subject") {
                title = f.innerText;
                return STOP_TRAVERSE;
              }

              return CONTINUE_TRAVERSE;
            });
          }
        }

        return CONTINUE_TRAVERSE;
      });

      if (title != config.content.get_issue_subject()) {
        if (confirm(texts.confirm_current_issue_is_desired) != true) {
          log("irrevelant issue opened, dies silently...");
          return;
        }
        // if true, continue processing
      }

      const close_badge = try_find_from_collection($e("content").children,
        (e) => {
          return e.tagName === "SPAN"
            && e.className.includes("badge-status-closed");
        });
      if (close_badge != undefined) {
        log("issue is not open, dies silently...");
        return;
      }

      // start issue autofill
      log("autofilling existing issue...");

      // click the "edit" button to put the issue into editable state
      const edit = find_from_collection(
        find_from_collection($e("content").children, (e) => {
          return e.tagName === "DIV" && e.className.includes("contextual");
        }).children,
        (e) => {
          return e.tagName === "A" && e.className.includes("icon-edit");
        }
      );
      edit.dispatchEvent(click);
      await sleep(config.timeout.update);

      // process issue description
      if (may_ask_yesno(config.content.update_issue_desc_in_existing_issue,
        texts.may_ask_update_issue_desc_in_existing_issue) === true) {
        const desc = $e("issue_description");
        desc.value = config.content
          .update_issue_desc_in_existing_issue_filter_func(desc.value);
        await sleep(config.timeout.field);
      }

      // issue outcome
      await select_from_combobox("issue_status_id", "3", () => {
        // TODO: resolve locale dependence
        // TODO: config
        return $e("select2-issue_status_id-container").innerText === "已解决";
      });

      // issue done ratio
      await select_from_combobox(
        "issue_done_ratio",
        config.content.issue_done_ratio,
        () => {
          // TODO: investigate if this is locale dependent
          return $e("select2-issue_done_ratio-container").innerText
            === config.content.issue_done_ratio.concat(" %");
        }
      );

      // actual work hours
      const time_entry_hours = $e("time_entry_hours");
      time_entry_hours.value = may_ask_string(config.content.time_entry_hours,
        texts.may_ask_time_entry_hours, config.content.estimated_hours);
      await sleep(config.timeout.field);

      // work activity type
      await select_from_combobox(
        "time_entry_activity_id",
        config.content.time_entry_activity_id,
        () => {
          return $e("select2-time_entry_activity_id-container").innerText
            === config.content.time_entry_activity_text;
        }
      );

      // add comments (aka workhour log)
      const time_entry_comments = $e("time_entry_comments");
      if (may_ask_yesno(config.content.use_issue_desc_as_time_entry_comments,
        texts.may_ask_use_issue_desc_as_time_entry_comments) === true) {
        // derive from issue description
        const desc = $e("issue_description");
        time_entry_comments.value = config.content
          .use_issue_desc_as_time_entry_comments_filter_func(desc.value);
      } else {
        // enter manually
        time_entry_comments.value = prompt(texts.prompt_time_entry_comments);
      }
      await sleep(config.timeout.field);

      // autofill complete, submit and close issue
      log("existing issue filled");
      if (may_ask_yesno(config.features.enable_auto_submit_existing_issue,
        texts.may_ask_submit_existing_issue) === false) {
        alert(texts.alert_submit_existing_issue);
        log("autosubmitting existing is disabled, stopping...");
        return;
      }

      log("submitting existing issue...");

      const submit = find_from_collection($e("issue-form").children, (e) => {
        return e.type === "submit" && e.name === "commit";
      });
      submit.click();

      return;
    } else {
      // unknown location, dies silently

      return;
    }
  })();
}