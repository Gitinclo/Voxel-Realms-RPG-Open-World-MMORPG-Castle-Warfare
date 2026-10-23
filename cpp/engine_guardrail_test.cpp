// SPDX-License-Identifier: Apache-2.0
// engine_guardrail_test.cpp — C++20 Guardrail Verification Entrypoint

#include "VoxelRealmsGuardrails.hpp"
#include <cassert>

int main() {
    using voxel::guardrails::computeRealmSuppressionMultiplier;
    using voxel::guardrails::CultivationRealm;
    using voxel::guardrails::CultivatorNode;
    using voxel::guardrails::SectHierarchyManager;

    constexpr double suppression = computeRealmSuppressionMultiplier(
        CultivationRealm::GoldenCore, CultivationRealm::QiRefinement);
    static_assert(suppression == 100.0);
    assert(suppression == 100.0);

    SectHierarchyManager sect;
    auto master = std::make_shared<CultivatorNode>("Daoist Sovereign",
                                                   CultivationRealm::GoldenCore, 250);
    sect.registerMaster(master);
    sect.enrollDisciple("Outer Disciple Lin", CultivationRealm::QiRefinement);
    sect.enrollDisciple("Inner Disciple Mei", CultivationRealm::FoundationEstablishment);

    assert(sect.hasActiveMaster());
    assert(sect.getDiscipleCount() == 2U);
    return 0;
}
