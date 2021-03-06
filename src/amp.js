/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import './polyfills';
import {installPerformanceService} from './service/performance-impl';
import {installPullToRefreshBlocker} from './pull-to-refresh';
import {templatesFor} from './template';
import {installCoreServices} from './amp-core-service';
import {installAd} from '../builtins/amp-ad';
import {installGlobalClickListener} from './document-click';
import {installImg} from '../builtins/amp-img';
import {installVideo} from '../builtins/amp-video';
import {installPixel} from '../builtins/amp-pixel';
import {installEmbed} from '../builtins/amp-embed';
import {installStyles, makeBodyVisible} from './styles';
import {installErrorReporting} from './error';
import {stubElements} from './custom-element';
import {adopt} from './runtime';
import {cssText} from '../build/css';
import {maybeValidate} from './validator-integration';
import {maybeTrackImpression} from './impression';

// We must under all circumstances call makeBodyVisible.
// It is much better to have AMP tags not rendered than having
// a completely blank page.
try {
  // Should happen first.
  installErrorReporting(window);  // Also calls makeBodyVisible on errors.
  const perf = installPerformanceService(window);

  perf.tick('is');
  installStyles(document, cssText, () => {
    try {
      installCoreServices(window);
      // We need the core services (viewer/resources) to start instrumenting
      perf.coreServicesAvailable();
      maybeTrackImpression(window);
      templatesFor(window);

      installImg(window);
      installAd(window);
      installPixel(window);
      installVideo(window);
      installEmbed(window);

      adopt(window);
      stubElements(window);

      installPullToRefreshBlocker(window);
      installGlobalClickListener(window);

      maybeValidate(window);
      makeBodyVisible(document, /* waitForExtensions */ true);
    } catch (e) {
      makeBodyVisible(document);
      throw e;
    } finally {
      perf.tick('e_is');
      // TODO(erwinm): move invocation of the `flush` method when we have the
      // new ticks in place to batch the ticks properly.
      perf.flush();
    }
  }, /* opt_isRuntimeCss */ true, /* opt_ext */ 'amp-runtime');
} catch (e) {
  // In case of an error call this.
  makeBodyVisible(document);
  throw e;
}

// Output a message to the console and add an attribute to the <html>
// tag to give some information that can be used in error reports.
// (At least by sophisticated users).
if (window.console) {
  (console.info || console.log).call(console,
      'Powered by AMP ⚡ HTML – Version $internalRuntimeVersion$');
}
window.document.documentElement.setAttribute('amp-version',
      '$internalRuntimeVersion$');
