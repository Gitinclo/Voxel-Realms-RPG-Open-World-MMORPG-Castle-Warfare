// SPDX-License-Identifier: Apache-2.0
// engine_guardrail_test.cpp — C++20 Guardrail Verification Entrypoint

#include "VoxelRealmsGuardrails.hpp"

int main() {
    using voxel::guardrails::computeRealmSuppressionMultiplier;
    using voxel::guardrails::CultivationRealm;
    using voxel::guardrails::CultivatorNode;
    using voxel::guardrails::SectHierarchyManager;

    constexpr double suppression = computeRealmSuppressionMultiplier(
        CultivationRealm::GoldenCore, CultivationRealm::QiRefinement);
    static_assert(suppression > 99.9);

    SectHierarchyManager sect;
    const auto masterRealm = CultivationRealm::GoldenCore;
    auto master = std::make_shared<CultivatorNode>("Daoist Sovereign", masterRealm, 250);
    sect.registerMaster(master);
    sect.enrollDisciple("Outer Disciple Lin", CultivationRealm::QiRefinement);
    sect.enrollDisciple("Inner Disciple Mei", CultivationRealm::FoundationEstablishment);

    if (suppression < 99.9 || !sect.hasActiveMaster() || sect.getDiscipleCount() != 2U) {
        return 1;
    }
    return 0;
}
